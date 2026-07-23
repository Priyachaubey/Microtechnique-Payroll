namespace Backend.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System;
using Backend.Models;
using Backend.Repositories;
using Backend.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileRepository _profileRepo;
    private readonly IUserService _userService;
    private readonly IWebHostEnvironment _env;
    private readonly IStorageService _storage;

    public ProfileController(IProfileRepository profileRepo, IUserService userService, IWebHostEnvironment env, IStorageService storage)
    {
        _profileRepo = profileRepo;
        _userService = userService;
        _env = env;
        _storage = storage;
    }

    private int GetEmpId()
    {
        var claim = User.FindFirst("EmpId")?.Value
                 ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private int GetSpaceId()
    {
        var claim = User.FindFirst("SpaceId")?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    private string GetRole() => User.FindFirst(ClaimTypes.Role)?.Value ?? "";

    // GET /api/Profile/photo/{empId}
    [HttpGet("photo/{empId:int}")]
    [Authorize]
    public async Task<IActionResult> GetProfilePhoto(int empId)
    {
        var currentEmpId = GetEmpId();
        var spaceId = GetSpaceId();
        var role = GetRole();
        
        // Security check using Service Layer
        try
        {
            if (currentEmpId != empId)
            {
                var targetUser = await _userService.GetUserByIdAsync(empId, currentEmpId, spaceId, role);
                if (targetUser == null) return NotFound();
            }
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }

        var profile = await _profileRepo.GetProfileAsync(empId);
        if (profile == null || string.IsNullOrEmpty(profile.ProfilePhotoUrl))
            return NotFound();

        var photoBytes = await _storage.ReadFileAsync(profile.ProfilePhotoUrl);
        if (photoBytes == null)
            return NotFound(new { message = "Profile photo not found." });

        var ext = Path.GetExtension(profile.ProfilePhotoUrl).ToLower();
        var contentType = ext switch
        {
            ".png" => "image/png",
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        return File(photoBytes, contentType);
    }

    // GET /api/Profile/me
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid token." });

        var profile = await _profileRepo.GetProfileAsync(empId);
        if (profile == null) return NotFound(new { message = "Profile not found." });

        if (!string.IsNullOrEmpty(profile.ProfilePhotoUrl))
        {
            profile.ProfilePhotoUrl = $"/api/Profile/photo/{profile.EmpId}";
        }

        return Ok(profile);
    }

    // GET /api/Profile/{empId} — Admin/Manager/TL read-only
    [HttpGet("{empId:int}")]
    [Authorize(Roles = "Admin,Manager,TeamLead")]
    public async Task<IActionResult> GetProfileByEmpId(int empId)
    {
        var spaceId = GetSpaceId();
        var role = GetRole();

        var callerEmpId = GetEmpId();
        try
        {
            var targetUser = await _userService.GetUserByIdAsync(empId, callerEmpId, spaceId, role);
            if (targetUser == null) return NotFound(new { message = "Profile not found." });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }

        var profile = await _profileRepo.GetProfileAsync(empId);
        if (profile == null) return NotFound(new { message = "Profile not found." });

        if (!string.IsNullOrEmpty(profile.ProfilePhotoUrl))
        {
            profile.ProfilePhotoUrl = $"/api/Profile/photo/{profile.EmpId}";
        }

        return Ok(profile);
    }

    // PUT /api/Profile/update/{empId?}
    [HttpPut("update/{empId:int?}")]
    public async Task<IActionResult> UpdateProfile(int? empId, [FromBody] UpdateProfileRequest request)
    {
        var currentEmpId = GetEmpId();
        if (currentEmpId == 0) return Unauthorized(new { message = "Invalid token." });

        int targetEmpId = currentEmpId;
        var spaceId = GetSpaceId();
        var role = GetRole();

        if (empId.HasValue)
        {
            if (role != "Admin" && role != "SuperAdmin")
            {
                return StatusCode(403, new { message = "Access denied." });
            }
            targetEmpId = empId.Value;
            try
            {
                var targetUser = await _userService.GetUserByIdAsync(targetEmpId, currentEmpId, spaceId, role);
                if (targetUser == null) return NotFound(new { message = "Employee not found." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, new { message = ex.Message });
            }
        }

        // Email and Role cannot be changed via this endpoint
        var updated = await _profileRepo.UpdateProfileAsync(targetEmpId, request);
        if (!updated) return NotFound(new { message = "Profile not found or no changes made." });

        return Ok(new { message = "Profile updated successfully." });
    }

    // POST /api/Profile/photo
    [HttpPost("photo")]
    public async Task<IActionResult> UploadPhoto(IFormFile file)
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid token." });

        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        // Validate image type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return BadRequest(new { message = "Only JPEG, PNG, and WebP images are allowed." });

        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "File size must be under 5 MB." });

        var ext = Path.GetExtension(file.FileName).ToLower();
        var fileName = $"emp_{empId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{ext}";
        
        var relativeUrl = await _storage.SaveFileAsync(file, "profile-photo", fileName);

        // Ensure leading slash for frontend path resolution
        if (!relativeUrl.StartsWith("/")) relativeUrl = "/" + relativeUrl;

        await _profileRepo.UpdateProfilePhotoAsync(empId, relativeUrl);

        return Ok(new { message = "Photo uploaded successfully.", photoUrl = relativeUrl });
    }

    // POST /api/Profile/documents
    [HttpPost("documents")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocuments([FromForm] List<string> documentTypes,
                                                      [FromForm] List<string> documentNumbers,
                                                      List<IFormFile> files)
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid token." });

        if (documentTypes == null || documentTypes.Count == 0)
            return BadRequest(new { message = "No document types provided." });

        if (documentTypes.Count != documentNumbers.Count || documentTypes.Count != files.Count)
            return BadRequest(new { message = "documentTypes, documentNumbers, and files arrays must have equal length." });

        var existingDocs = await _profileRepo.GetDocumentsByEmpIdAsync(empId);
        bool hasPan = existingDocs.Any(d => d.DocumentType.Trim().Equals("PAN", StringComparison.OrdinalIgnoreCase));
        bool hasAadhar = existingDocs.Any(d => d.DocumentType.Trim().Equals("Aadhar", StringComparison.OrdinalIgnoreCase));

        var upperTypes = documentTypes.Select(t => t.Trim().ToUpper()).ToList();
        if (!hasPan && !upperTypes.Contains("PAN"))
            return BadRequest(new { message = "PAN document is mandatory." });
        if (!hasAadhar && !upperTypes.Contains("AADHAR"))
            return BadRequest(new { message = "Aadhar document is mandatory." });

        if (upperTypes.Distinct().Count() != upperTypes.Count)
            return BadRequest(new { message = "Duplicate document types are not allowed." });

        foreach (var f in files)
            if (f.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = $"File '{f.FileName}' exceeds 10 MB limit." });

        var savedDocs = new List<object>();

        for (int i = 0; i < documentTypes.Count; i++)
        {
            var file = files[i];
            var ext = Path.GetExtension(file.FileName).ToLower();
            var safeType = string.Concat(documentTypes[i].Trim().Split(Path.GetInvalidFileNameChars()));
            var fileName = $"emp_{empId}_{safeType}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext}";
            
            var relativeUrl = await _storage.SaveFileAsync(file, "Document", fileName);
            if (!relativeUrl.StartsWith("/")) relativeUrl = "/" + relativeUrl;

            var doc = new DocumentRecord
            {
                EmpId = empId,
                DocumentType = documentTypes[i].Trim(),
                DocumentNumber = documentNumbers[i].Trim(),
                FileUrl = relativeUrl,
            };

            var docId = await _profileRepo.SaveDocumentAsync(doc);
            savedDocs.Add(new { docId, documentType = doc.DocumentType, fileUrl = relativeUrl });
        }

        return Ok(new { message = "Documents saved successfully.", documents = savedDocs });
    }

    // GET /api/Profile/documents
    [HttpGet("documents")]
    public async Task<IActionResult> GetMyDocuments()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized();
        var docs = await _profileRepo.GetDocumentsByEmpIdAsync(empId);
        return Ok(docs);
    }

    // DELETE /api/Profile/documents/{docId}
    [HttpDelete("documents/{docId:int}")]
    public async Task<IActionResult> DeleteDocument(int docId)
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized();
        var deleted = await _profileRepo.DeleteDocumentAsync(docId, empId);
        if (!deleted) return NotFound(new { message = "Document not found." });
        return Ok(new { message = "Document deleted." });
    }

    [HttpPost("update-backup-email")]
    public async Task<IActionResult> UpdateBackupEmail([FromBody] UpdateBackupEmailRequest request)
    {
        try
        {
            var empId = GetEmpId();
            if (empId == 0) return Unauthorized(new { message = "Invalid token." });

            if (string.IsNullOrEmpty(request.BackupEmail))
                return BadRequest(new { message = "Backup email is required." });

            if (!System.Text.RegularExpressions.Regex.IsMatch(request.BackupEmail, @"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"))
                return BadRequest(new { message = "Invalid backup email format." });

            var success = await _userService.UpdateBackupEmailAsync(empId, request.BackupEmail);
            if (!success)
                return NotFound(new { message = "Profile not found." });

            return Ok(new { message = "Backup email updated successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UpdateBackupEmail Error] {ex.Message}");
            return StatusCode(500, new { message = "Failed to update backup email." });
        }
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var empId = GetEmpId();
            if (empId == 0) return Unauthorized(new { message = "Invalid token." });

            if (string.IsNullOrEmpty(request.OldPassword) || string.IsNullOrEmpty(request.NewPassword))
                return BadRequest(new { message = "Old password and new password are required." });

            if (request.NewPassword.Length < 6)
                return BadRequest(new { message = "New password must be at least 6 characters long." });

            var success = await _userService.ChangePasswordAsync(empId, request.OldPassword, request.NewPassword);
            if (!success)
                return BadRequest(new { message = "Incorrect old password or user not found." });

            return Ok(new { message = "Password updated successfully." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ChangePassword Error] {ex.Message}");
            return StatusCode(500, new { message = "Failed to change password." });
        }
    }

    public class SmtpSettingsRequest
    {
        public string SmtpHost { get; set; }
        public int SmtpPort { get; set; }
        public string SmtpUsername { get; set; }
        public string SmtpPassword { get; set; }
        public string SmtpFromEmail { get; set; }
    }

    [HttpGet("smtp-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetSmtpSettings()
    {
        try
        {
            var spaceId = GetSpaceId();
            if (spaceId <= 0) return BadRequest(new { message = "Invalid space ID." });

            var query = "SELECT smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email FROM t_spaces WHERE spaceid = @SpaceId";
            using var conn = new Npgsql.NpgsqlConnection(GetConnectionString());
            var smtp = await Dapper.SqlMapper.QueryFirstOrDefaultAsync<dynamic>(conn, query, new { SpaceId = spaceId });

            if (smtp == null) return NotFound(new { message = "Settings not found" });

            return Ok(new
            {
                smtpHost = smtp.smtp_host,
                smtpPort = smtp.smtp_port,
                smtpUsername = smtp.smtp_username,
                smtpPassword = smtp.smtp_password,
                smtpFromEmail = smtp.smtp_from_email
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Profile] GetSmtpSettings error: {ex.Message}");
            return StatusCode(500, new { message = "Failed to fetch SMTP settings" });
        }
    }

    [HttpPost("smtp-settings")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateSmtpSettings([FromBody] SmtpSettingsRequest req)
    {
        try
        {
            var spaceId = GetSpaceId();
            if (spaceId <= 0) return BadRequest(new { message = "Invalid space ID." });

            var query = @"
                UPDATE t_spaces 
                SET smtp_host = @SmtpHost, 
                    smtp_port = @SmtpPort, 
                    smtp_username = @SmtpUsername, 
                    smtp_password = @SmtpPassword, 
                    smtp_from_email = @SmtpFromEmail
                WHERE spaceid = @SpaceId";

            using var conn = new Npgsql.NpgsqlConnection(GetConnectionString());
            await Dapper.SqlMapper.ExecuteAsync(conn, query, new 
            { 
                req.SmtpHost, 
                req.SmtpPort, 
                req.SmtpUsername, 
                req.SmtpPassword, 
                req.SmtpFromEmail, 
                SpaceId = spaceId 
            });

            return Ok(new { message = "SMTP settings updated successfully" });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Profile] UpdateSmtpSettings error: {ex.Message}");
            return StatusCode(500, new { message = "Failed to update SMTP settings" });
        }
    }

    private string GetConnectionString()
    {
        return new Microsoft.Extensions.Configuration.ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build().GetConnectionString("DefaultConnection");
    }
}

public class UpdateBackupEmailRequest
{
    public string BackupEmail { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

