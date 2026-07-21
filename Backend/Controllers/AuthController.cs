namespace Backend.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using Backend.Models;
using Backend.Repositories;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly Backend.Services.INotificationService _notificationService;
    private readonly Backend.Repositories.ISuperAdminRepository _superAdminRepository;
    private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;
    private readonly Resend.IResend _resend;
    private readonly System.Data.IDbConnection _dbConnection;

    public AuthController(
        IUserRepository userRepository,
        IConfiguration configuration,
        Backend.Services.INotificationService notificationService,
        Backend.Repositories.ISuperAdminRepository superAdminRepository,
        Microsoft.Extensions.Caching.Memory.IMemoryCache cache,
        Resend.IResend resend,
        System.Data.IDbConnection dbConnection)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _notificationService = notificationService;
        _superAdminRepository = superAdminRepository;
        _cache = cache;
        _resend = resend;
        _dbConnection = dbConnection;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request?.Email) || string.IsNullOrWhiteSpace(request?.Password))
            {
                Console.WriteLine("[Login] Rejected: empty email or password in request body.");
                return BadRequest(new { message = "Email and password are required." });
            }

            var emailForLookup = request.Email.Trim();
            Console.WriteLine($"[Login] Attempt for email='{emailForLookup}'");

            var user = await _userRepository.GetUserByEmailAsync(emailForLookup);

            if (user == null)
            {
                // Fallback: Check if this is a SuperAdmin login
                var superAdmin = await _superAdminRepository.GetSuperAdminByEmailAsync(emailForLookup);
                if (superAdmin == null)
                {
                    Console.WriteLine($"[Login] FAILED - no user or superadmin found for email='{emailForLookup}'. " +
                                       "Check: (1) DB the API is actually connected to (see ConnectionStrings:DefaultConnection), " +
                                       "(2) that this email exists in t_users or t_superadmins, (3) trailing whitespace/typo in the email.");
                    return Unauthorized(new { message = "Invalid email or password" });
                }

                // Verify SuperAdmin password
                var superHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
                Microsoft.AspNetCore.Identity.PasswordVerificationResult verifySuperResult = Microsoft.AspNetCore.Identity.PasswordVerificationResult.Failed;
                try
                {
                    verifySuperResult = superHasher.VerifyHashedPassword(new object(), superAdmin.PasswordHash, request.Password);
                }
                catch (Exception hashEx)
                {
                    // Thrown when passwordhash in t_superadmins is not a valid PBKDF2/Base64 hash (e.g. corrupted seed data or plaintext)
                    Console.WriteLine($"[Login] SuperAdmin hash format error for '{emailForLookup}', checking plaintext fallback... {hashEx.Message}");
                }

                if (verifySuperResult != Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success &&
                    verifySuperResult != Microsoft.AspNetCore.Identity.PasswordVerificationResult.SuccessRehashNeeded)
                {
                    // Fallback plain-text check for SuperAdmin
                    if (superAdmin.PasswordHash.Trim() == request.Password.Trim())
                    {
                        try
                        {
                            string secureHash = superHasher.HashPassword(new object(), request.Password);
                            superAdmin.PasswordHash = secureHash;
                            await _superAdminRepository.UpdateSuperAdminAsync(superAdmin);
                            System.Console.WriteLine($"[Auth Migration] Automatically migrated legacy plain-text password to secure hash for SuperAdmin {superAdmin.Email}");
                        }
                        catch (Exception ex)
                        {
                            System.Console.WriteLine($"[Auth Migration Error] Failed to auto-migrate password hash for SuperAdmin {superAdmin.Email}: {ex.Message}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[Login] FAILED - SuperAdmin '{emailForLookup}' found, but password did not match stored hash.");
                        return Unauthorized(new { message = "Invalid email or password" });
                    }
                }

                Console.WriteLine($"[Login] SUCCESS - SuperAdmin '{emailForLookup}' authenticated.");

                // Generate JWT with SuperAdmin role
                var superUser = new User
                {
                    EmpId = superAdmin.Id,
                    Email = superAdmin.Email,
                    Role = "SuperAdmin",
                    SpaceId = 0
                };
                var superToken = GenerateJwtToken(superUser);

                return Ok(new
                {
                    Token = superToken,
                    Role = superUser.Role,
                    EmpId = superUser.EmpId,
                    SpaceId = superUser.SpaceId,
                    Name = superAdmin.Name,
                    Email = superAdmin.Email
                });
            }

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                Console.WriteLine($"[Login] FAILED - user '{emailForLookup}' (EmpId={user.EmpId}) has a NULL/empty passwordhash in t_users.");
                return StatusCode(500, "Password missing in DB");
            }

            // Secure PBKDF2 Password Verification with Old Plain-Text Fallback and Auto-Migration
            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            bool isVerified = false;
            bool shouldMigrate = false;

            try
            {
                var verifyResult = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
                if (verifyResult == Microsoft.AspNetCore.Identity.PasswordVerificationResult.Success || 
                    verifyResult == Microsoft.AspNetCore.Identity.PasswordVerificationResult.SuccessRehashNeeded)
                {
                    isVerified = true;
                }
            }
            catch (Exception)
            {
                // FormatException occurs if the passwordhash field holds a legacy plain-text string (not a valid Base64 hash)
                isVerified = false;
            }

            // Fallback plain-text check if not verified yet
            if (!isVerified)
            {
                if (user.PasswordHash.Trim() == request.Password.Trim())
                {
                    isVerified = true;
                    shouldMigrate = true;
                }
            }

            if (!isVerified)
            {
                Console.WriteLine($"[Login] FAILED - user '{emailForLookup}' (EmpId={user.EmpId}) found in DB, but password did not match " +
                                   "(neither PBKDF2 hash nor legacy plain-text). This means the password typed does not match what's stored — " +
                                   "not a bug, unless the stored hash itself is known to be wrong/corrupted.");
                return Unauthorized(new { message = "Invalid email or password" });
            }

            Console.WriteLine($"[Login] SUCCESS - user '{emailForLookup}' (EmpId={user.EmpId}, Role={user.Role}) authenticated." +
                               (shouldMigrate ? " [legacy plain-text password auto-migrated to PBKDF2]" : ""));

            // Auto-migrate if plain-text password match was authenticated
            if (shouldMigrate)
            {
                try
                {
                    string secureHash = hasher.HashPassword(user, request.Password);
                    await _userRepository.UpdatePasswordHashAsync(user.EmpId, secureHash);
                    System.Console.WriteLine($"[Auth Migration] Automatically migrated legacy plain-text password to secure hash for user {user.Email}");
                }
                catch (Exception ex)
                {
                    System.Console.WriteLine($"[Auth Migration Error] Failed to auto-migrate password hash for user {user.Email}: {ex.Message}");
                }
            }

            if (user.Status == "Pending")
            {
                Console.WriteLine($"[Login] BLOCKED - user '{emailForLookup}' (EmpId={user.EmpId}) has Status='Pending', awaiting admin approval.");
                return Unauthorized(new { message = "Your account is pending approval by the admin." });
            }

            // If user is deleted by SuperAdmin
            if (user.Status == "Deleted")
            {
                Console.WriteLine($"[Login] BLOCKED - user '{emailForLookup}' (EmpId={user.EmpId}) has Status='Deleted'.");
                return Unauthorized(new { message = "Please contact Super Admin." });
            }

            // SuperAdmin access control — ONLY for Admin role
            // Employees, TL, Managers are NOT affected
            if (user.Role == "Admin" && !user.StatusBySuperAdmin)
            {
                Console.WriteLine($"[Login] BLOCKED - Admin '{emailForLookup}' (EmpId={user.EmpId}) has StatusBySuperAdmin=false.");
                return StatusCode(403, new { message = "Access restricted by SuperAdmin. Contact MTI support." });
            }

            // SAFE JWT CLAIM VALUES
            var safeUser = new User
            {
                EmpId = user.EmpId,
                Email = user.Email,
                Role = user.Role ?? "Employee",
                SpaceId = user.SpaceId ?? 0
            };

            var token = GenerateJwtToken(safeUser);
            Console.WriteLine($"[Login] JWT generated for EmpId={safeUser.EmpId}, Role={safeUser.Role}, length={token.Length} chars. Returning 200 OK.");

            return Ok(new
            {
                Token = token,
                Role = safeUser.Role,
                EmpId = safeUser.EmpId,
                SpaceId = safeUser.SpaceId,
                Name = user.Name ?? user.Email
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine("[Login] UNHANDLED EXCEPTION: " + ex.ToString());
            return StatusCode(500, new { message = "Internal Server Error", detail = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if email already exists
            var existing = await _userRepository.GetUserByEmailAsync(request.Email.Trim());
            if (existing != null)
                return Conflict(new { message = "An account with this email already exists." });

            string role = request.Role ?? "Employee";
            // Admin accounts start as Pending to require SuperAdmin approval
            string status = role == "SuperAdmin" ? "Active" : "Pending";

            // Validate role-based fields
            if (role == "Admin" && string.IsNullOrEmpty(request.SpaceName))
            {
                return BadRequest(new { message = "Space name is required for Admin registration" });
            }
            if (role != "Admin" && !request.SpaceId.HasValue)
            {
                return BadRequest(new { message = "Space ID is required for non-Admin registration" });
            }

            var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
            var newUser = new User
            {
                Email        = request.Email.Trim(),
                Name         = request.Name ?? (request.Email.Contains("@") ? request.Email.Split('@')[0] : "New User"),
                Role         = role,
                SpaceId      = role == "Admin" ? null : request.SpaceId,
                Gender       = request.Gender ?? "Unknown",
                Status       = status,
                Phone        = request.Phone,
                Address      = request.Address,
                DateOfJoining = DateTime.Today  // Automatic date setting
            };
            newUser.PasswordHash = hasher.HashPassword(newUser, request.Password);

            var empId = await _userRepository.CreateUserAsync(newUser);
            newUser.EmpId = empId;

            if (role == "Admin" && !string.IsNullOrEmpty(request.SpaceName))
            {
                int newSpaceId = await _userRepository.CreateSpaceAsync(request.SpaceName, empId);
                newUser.SpaceId = newSpaceId;
                await _userRepository.UpdateUserSpaceIdAsync(empId, newSpaceId);
            }

            try
            {
                await _notificationService.NotifyRegisterAsync(empId, newUser.Email, newUser.Role ?? "Employee", newUser.SpaceId ?? 0);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification Trigger Error] Register: {ex.Message}");
            }

            var token = GenerateJwtToken(newUser);
            return Ok(new { Token = token, Role = newUser.Role, EmpId = empId, SpaceId = newUser.SpaceId, Name = newUser.Name ?? newUser.Email, Status = newUser.Status });
        }
        catch (Exception ex)
        {
            System.IO.File.WriteAllText("error_log.txt", ex.ToString());
            return StatusCode(500, new { message = "Registration failed", error = ex.Message, details = ex.InnerException?.Message });
        }
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest(new { message = "Email is required" });

            var emailNormalized = request.Email.Trim();
            var emailKey = emailNormalized.ToLowerInvariant();
            var user = await _userRepository.GetUserByEmailAsync(emailNormalized);
            var superAdmin = await _superAdminRepository.GetSuperAdminByEmailAsync(emailNormalized);

            // "Do NOT expose if email exists or not (security best practice)"
            if (user == null && superAdmin == null)
            {
                return Ok(new { message = "If your email is registered in our system, a 6-digit OTP has been sent." });
            }

            // Generate 6-digit OTP
            var rand = new Random();
            string otp = rand.Next(100000, 999999).ToString();
            string targetEmail = emailNormalized;
            bool isSuperAdmin = superAdmin != null;

            if (!isSuperAdmin && user != null)
            {
                var expiresAt = DateTime.UtcNow.AddMinutes(5); // valid for 5 minutes
                await _userRepository.CreateOtpAsync(user.EmpId, otp, expiresAt);
                targetEmail = !string.IsNullOrEmpty(user.BackupEmail) ? user.BackupEmail : user.Email!;
            }
            else
            {
                // SuperAdmin OTP - store in cache for 30 minutes
                targetEmail = superAdmin?.Email ?? emailNormalized;
                var cacheKey = $"SA_OTP_{emailKey}";
                _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(30));
            }

            // Send Email logic
            try
            {
                bool useGlobalResend = true;

                // Try to use tenant SMTP settings if not SuperAdmin/Admin
                if (!isSuperAdmin && user != null && user.SpaceId.HasValue)
                {
                    var spaceQuery = "SELECT smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email FROM t_spaces WHERE spaceid = @SpaceId";
                    var spaceSmtp = await Dapper.SqlMapper.QueryFirstOrDefaultAsync<dynamic>(_dbConnection, spaceQuery, new { SpaceId = user.SpaceId });

                    if (spaceSmtp != null && !string.IsNullOrEmpty(spaceSmtp.smtp_host) && !string.IsNullOrEmpty(spaceSmtp.smtp_from_email))
                    {
                        useGlobalResend = false;
                        
                        var emailMessage = new MimeKit.MimeMessage();
                        emailMessage.From.Add(new MimeKit.MailboxAddress("Support", spaceSmtp.smtp_from_email));
                        emailMessage.To.Add(new MimeKit.MailboxAddress("", targetEmail));
                        emailMessage.Subject = "Password Reset OTP";
                        
                        var bodyBuilder = new MimeKit.BodyBuilder
                        {
                            HtmlBody = $@"
                                <div style='font-family:sans-serif'>
                                    <h2>Your OTP Code</h2>
                                    <h1>{otp}</h1>
                                    <p>This OTP is valid for 5 minutes.</p>
                                </div>"
                        };
                        emailMessage.Body = bodyBuilder.ToMessageBody();

                        using (var client = new MailKit.Net.Smtp.SmtpClient())
                        {
                            await client.ConnectAsync(spaceSmtp.smtp_host, (int)spaceSmtp.smtp_port, MailKit.Security.SecureSocketOptions.StartTls);
                            if (!string.IsNullOrEmpty(spaceSmtp.smtp_username))
                            {
                                await client.AuthenticateAsync(spaceSmtp.smtp_username, spaceSmtp.smtp_password);
                            }
                            await client.SendAsync(emailMessage);
                            await client.DisconnectAsync(true);
                        }
                        
                        Console.WriteLine($"[Tenant SMTP] Successfully sent OTP to {targetEmail} using {spaceSmtp.smtp_from_email}.");
                    }
                }

                if (useGlobalResend)
                {
                    var message = new Resend.EmailMessage();
                    message.From = "VeriFind <microtechniqueit@gmail.com>"; // Global SuperAdmin/Admin Email
                    message.To.Add(targetEmail);
                    message.Subject = "Password Reset OTP";
                    message.HtmlBody = $@"
                        <div style='font-family:sans-serif'>
                            <h2>Your OTP Code</h2>
                            <h1>{otp}</h1>
                            <p>This OTP is valid for {(isSuperAdmin ? "30" : "5")} minutes.</p>
                        </div>";

                    await _resend.EmailSendAsync(message);
                    Console.WriteLine($"[Resend SDK] Successfully sent password reset OTP to {targetEmail}. OTP: {otp}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("==========================================================================");
                Console.WriteLine($"[EMAIL FAILED] {ex.Message}");
                Console.WriteLine($"[MOCK] TARGET: {targetEmail}");
                Console.WriteLine($"[MOCK] OTP: {otp}");
                Console.WriteLine("==========================================================================");
            }

            return Ok(new { message = "If your email is registered in our system, a 6-digit OTP has been sent." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ForgotPassword Error] {ex.Message}");
            return StatusCode(500, new { message = "Failed to initiate password reset." });
        }
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Otp))
                return BadRequest(new { message = "Email and OTP are required" });

            var emailNormalized = request.Email.Trim();
            var emailKey = emailNormalized.ToLowerInvariant();
            var user = await _userRepository.GetUserByEmailAsync(emailNormalized);
            var superAdmin = await _superAdminRepository.GetSuperAdminByEmailAsync(emailNormalized);

            if (user == null && superAdmin == null)
                return BadRequest(new { message = "Invalid email or OTP." });

            if (superAdmin != null)
            {
                // SuperAdmin Verification
                var cacheKey = $"SA_OTP_{emailKey}";
                if (_cache.TryGetValue(cacheKey, out string? cachedOtp) && cachedOtp == request.Otp.Trim())
                {
                    // Store verification token in cache for 30 minutes
                    var verifiedKey = $"SA_VERIFIED_{emailKey}";
                    _cache.Set(verifiedKey, request.Otp.Trim(), TimeSpan.FromMinutes(30));
                    return Ok(new { message = "OTP verified successfully. You may now reset your password." });
                }
                return BadRequest(new { message = "Invalid or expired OTP." });
            }
            else
            {
                // Standard User Verification
                var otpRecord = await _userRepository.GetActiveOtpAsync(user!.EmpId, request.Otp.Trim());
                if (otpRecord == null)
                {
                    return BadRequest(new { message = "Invalid, expired, or already used OTP." });
                }
                return Ok(new { message = "OTP verified successfully. You may now reset your password." });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[VerifyOtp Error] {ex.Message}");
            return StatusCode(500, new { message = "OTP verification failed." });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Otp) || string.IsNullOrEmpty(request.NewPassword))
                return BadRequest(new { message = "Email, OTP, and new password are required" });

            var emailNormalized = request.Email.Trim();
            var emailKey = emailNormalized.ToLowerInvariant();
            var user = await _userRepository.GetUserByEmailAsync(emailNormalized);
            var superAdmin = await _superAdminRepository.GetSuperAdminByEmailAsync(emailNormalized);

            if (user == null && superAdmin == null)
                return BadRequest(new { message = "Invalid request." });

            if (superAdmin != null)
            {
                // Verify SuperAdmin token in cache
                var verifiedKey = $"SA_VERIFIED_{emailKey}";
                if (!_cache.TryGetValue(verifiedKey, out string? cachedVerifiedOtp) || cachedVerifiedOtp != request.Otp.Trim())
                {
                    return BadRequest(new { message = "Invalid or expired OTP session." });
                }

                // Update SuperAdmin Password
                var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
                string hashedNew = hasher.HashPassword(new object(), request.NewPassword);
                superAdmin.PasswordHash = hashedNew;
                await _superAdminRepository.UpdateSuperAdminAsync(superAdmin);

                // Clear cache entries
                _cache.Remove($"SA_OTP_{emailKey}");
                _cache.Remove(verifiedKey);

                return Ok(new { message = "Password reset successfully. You can now login with your new password." });
            }
            else
            {
                // Standard User Reset
                var otpRecord = await _userRepository.GetActiveOtpAsync(user!.EmpId, request.Otp.Trim());
                if (otpRecord == null)
                {
                    return BadRequest(new { message = "Invalid or expired OTP session." });
                }

                var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<User>();
                string hashedNew = hasher.HashPassword(user, request.NewPassword);
                await _userRepository.UpdatePasswordHashAsync(user.EmpId, hashedNew);

                // Mark OTP as used
                int otpId = 0;
                if (otpRecord is IDictionary<string, object> dict)
                {
                    if (dict.TryGetValue("id", out var idVal) || dict.TryGetValue("Id", out idVal))
                    {
                        otpId = Convert.ToInt32(idVal);
                    }
                }
                if (otpId > 0)
                {
                    await _userRepository.MarkOtpAsUsedAsync(otpId);
                }

                // Broadcast real-time PasswordReset notification
                try
                {
                    await _notificationService.NotifyPasswordResetAsync(user.EmpId, user.Email ?? "", user.SpaceId ?? 0);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[PasswordReset Notification Error] {ex.Message}");
                }

                return Ok(new { message = "Password reset successfully. You can now login with your new password." });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ResetPassword Error] {ex.Message}");
            return StatusCode(500, new { message = "Failed to reset password." });
        }
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "DefaultKeyForDevelopmentOnly"));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.EmpId.ToString()),
            new Claim("EmpId", user.EmpId.ToString()),
            new Claim(ClaimTypes.Role, user.Role ?? "Employee"),
            new Claim("SpaceId", user.SpaceId?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpGet("pricing")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPricingConfig()
    {
        try
        {
            var starterPrice = "49";
            var professionalPrice = "99";

            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (var conn = new Npgsql.NpgsqlConnection(connectionString))
            {
                await conn.OpenAsync();
                
                using (var cmdSeed = new Npgsql.NpgsqlCommand(@"
                    INSERT INTO t_global_configs (config_key, config_value)
                    VALUES ('employee_price_starter_inr', '49')
                    ON CONFLICT (config_key) DO NOTHING;
                ", conn))
                {
                    await cmdSeed.ExecuteNonQueryAsync();
                }

                var sql = "SELECT config_key, config_value FROM t_global_configs WHERE config_key IN ('employee_price_inr', 'employee_price_starter_inr');";
                using (var cmd = new Npgsql.NpgsqlCommand(sql, conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        var key = reader.GetString(0);
                        var val = reader.GetString(1);
                        if (key == "employee_price_inr") professionalPrice = val;
                        else if (key == "employee_price_starter_inr") starterPrice = val;
                    }
                }
            }

            return Ok(new { starter = starterPrice, professional = professionalPrice });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[GetPricingConfig Failed] {ex.Message}");
            return Ok(new { starter = "49", professional = "99" });
        }
    }

    [HttpPost("consultation-request")]
    public async Task<IActionResult> SubmitConsultationRequest([FromBody] ConsultationRequestModel model)
    {
        // 1. Save the request in the database as a system notice for SuperAdmin
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (var conn = new Npgsql.NpgsqlConnection(connectionString))
            {
                await conn.OpenAsync();
                var sql = @"
                    INSERT INTO t_notices (noticetext, totype, createdat, preference, status)
                    VALUES (@NoticeText, 'SuperAdmin', NOW(), 'High', 'Open');";
                using (var cmd = new Npgsql.NpgsqlCommand(sql, conn))
                {
                    var noticeText = $"[Onboarding Request] Name: {model.Name}, Email: {model.Email}, Company: {model.Company}, Workforce: {model.Employees}, Interest: {model.Interest}, Notes: {model.Message}";
                    cmd.Parameters.AddWithValue("NoticeText", noticeText);
                    await cmd.ExecuteNonQueryAsync();
                }
            }
            Console.WriteLine($"[Consultation Request Saved to DB] Company: {model.Company}");
        }
        catch (Exception dbEx)
        {
            Console.WriteLine($"[Database Save Failed for Consultation Request] {dbEx.Message}");
        }

        // 2. Attempt to send email via Resend
        try
        {
            var message = new Resend.EmailMessage();
            message.From = "Microtechnique Onboarding <onboarding@resend.dev>";
            message.To.Add("microtechniqueit@gmail.com");
            message.Subject = $"New Setup Consultation Request from {model.Company}";
            message.HtmlBody = $@"
                <div style='font-family:sans-serif; line-height:1.6; max-width:600px; margin:0 auto; padding:20px; border:1px solid #eee; border-radius:10px;'>
                    <h2 style='color:#3b82f6;'>Onboarding Setup Request</h2>
                    <p><strong>Full Name:</strong> {model.Name}</p>
                    <p><strong>Work Email:</strong> {model.Email}</p>
                    <p><strong>Company Name:</strong> {model.Company}</p>
                    <p><strong>Workforce Size:</strong> {model.Employees}</p>
                    <p><strong>Primary Solution Interest:</strong> {model.Interest}</p>
                    <p><strong>Consulting Notes:</strong> {model.Message}</p>
                </div>";

            await _resend.EmailSendAsync(message);
            Console.WriteLine($"[Consultation Request Email Sent] To: microtechniqueit@gmail.com");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Consultation Request Email Failed] {ex.Message}");
            // We do not throw a 500 error because the request was already successfully saved to the database!
        }

        return Ok(new { message = "Onboarding request sent successfully" });
    }

    [HttpPost("contact-request")]
    public async Task<IActionResult> SubmitContactRequest([FromBody] ContactRequestModel model)
    {
        // 1. Save the request in the database as a system notice for SuperAdmin
        try
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            using (var conn = new Npgsql.NpgsqlConnection(connectionString))
            {
                await conn.OpenAsync();
                var sql = @"
                    INSERT INTO t_notices (noticetext, totype, createdat, preference, status)
                    VALUES (@NoticeText, 'SuperAdmin', NOW(), 'High', 'Open');";
                using (var cmd = new Npgsql.NpgsqlCommand(sql, conn))
                {
                    var noticeText = $"[Contact Us Message] Name: {model.Name}, Email: {model.Email}, Company: {model.Company}, Workforce: {model.Employees}, Message: {model.Message}";
                    cmd.Parameters.AddWithValue("NoticeText", noticeText);
                    await cmd.ExecuteNonQueryAsync();
                }
            }
            Console.WriteLine($"[Contact Request Saved to DB] Company: {model.Company}");
        }
        catch (Exception dbEx)
        {
            Console.WriteLine($"[Database Save Failed for Contact Request] {dbEx.Message}");
        }

        // 2. Attempt to send email via Resend
        try
        {
            var message = new Resend.EmailMessage();
            message.From = "Microtechnique Contact <onboarding@resend.dev>";
            message.To.Add("microtechniqueit@gmail.com");
            message.Subject = $"New Contact Us Inquiry from {model.Name} ({model.Company})";
            message.HtmlBody = $@"
                <div style='font-family:sans-serif; line-height:1.6; max-width:600px; margin:0 auto; padding:20px; border:1px solid #eee; border-radius:10px;'>
                    <h2 style='color:#10b981;'>Contact Us Message</h2>
                    <p><strong>Full Name:</strong> {model.Name}</p>
                    <p><strong>Work Email:</strong> {model.Email}</p>
                    <p><strong>Company Name:</strong> {model.Company}</p>
                    <p><strong>Workforce Size:</strong> {model.Employees}</p>
                    <p><strong>Message / Query:</strong> {model.Message}</p>
                </div>";

            await _resend.EmailSendAsync(message);
            Console.WriteLine($"[Contact Request Email Sent] To: microtechniqueit@gmail.com");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Contact Request Email Failed] {ex.Message}");
        }

        return Ok(new { message = "Message sent successfully" });
    }
}

public class ConsultationRequestModel
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Employees { get; set; } = string.Empty;
    public string Interest { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class ContactRequestModel
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Employees { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class LoginRequest
{
    public required string Email    { get; set; }
    public required string Password { get; set; }
}

public class RegisterRequest
{
    public required string Email    { get; set; }
    public required string Password { get; set; }
    public string? Role     { get; set; }   // defaults to "Employee"
    public int? SpaceId     { get; set; }
    public string? SpaceName { get; set; }
    public string? Gender   { get; set; }
    public string? Name     { get; set; }
    public string? Phone    { get; set; }
    public string? Address  { get; set; }
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class VerifyOtpRequest
{
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
