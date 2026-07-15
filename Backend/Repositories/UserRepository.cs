namespace Backend.Repositories;

using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Backend.Models;
using Dapper;

public class UserRepository : IUserRepository
{
    private readonly IDbConnection _dbConnection;

    public UserRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    public async Task<IEnumerable<User>> GetAllUsersAsync()
    {
        var query = @"SELECT u.empid, u.name, u.spaceid, u.email, u.passwordhash, u.gender, u.status, u.role, 
                             u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                             u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail,
                             u.departmentid, d.name AS departmentname
                      FROM t_users u
                      LEFT JOIN t_departments d ON u.departmentid = d.departmentid";
        return await _dbConnection.QueryAsync<User>(query);
    }

    public async Task<User?> GetUserByIdAsync(int empid)
    {
        var query = @"SELECT u.empid, u.name, u.spaceid, u.email, u.passwordhash, u.gender, u.status, u.role, 
                             u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                             u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail,
                             u.departmentid, d.name AS departmentname
                      FROM t_users u
                      LEFT JOIN t_departments d ON u.departmentid = d.departmentid 
                      WHERE u.empid = @EmpId";
        return await _dbConnection.QueryFirstOrDefaultAsync<User>(query, new { EmpId = empid });
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        var query = @"
        SELECT 
            u.empid,
            u.name,
            u.spaceid,
            u.email,
            u.passwordhash,
            u.gender,
            u.status,
            u.role,
            u.phone,
            u.address,
            COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp as dateofjoining,
            u.accountnumber,
            u.bankname,
            u.accountholdername,
            u.ifsccode,
            u.upiid,
            u.backupemail,
            COALESCE(u.statusbysuperadmin, FALSE) AS statusbysuperadmin,
            u.departmentid, d.name AS departmentname
        FROM t_users u
        LEFT JOIN t_departments d ON u.departmentid = d.departmentid
        WHERE LOWER(u.email) = LOWER(@Email)";
        return await _dbConnection.QueryFirstOrDefaultAsync<User>(query, new { Email = email });
    }

    public async Task<IEnumerable<User>> SearchUsersAsync(string searchTerm)
    {
        var query = @"SELECT u.empid, u.name, u.spaceid, u.email, u.passwordhash, u.gender, u.status, u.role, 
                             u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                             u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail,
                             u.departmentid, d.name AS departmentname
                      FROM t_users u
                      LEFT JOIN t_departments d ON u.departmentid = d.departmentid 
                      WHERE u.email ILIKE @SearchTerm OR u.role ILIKE @SearchTerm OR u.name ILIKE @SearchTerm";
        return await _dbConnection.QueryAsync<User>(query, new { SearchTerm = $"%{searchTerm}%" });
    }

    public async Task<int> CreateUserAsync(User user)
    {
        var query = @"
            INSERT INTO t_users (name, spaceid, email, passwordhash, gender, status, role, phone, address, dateofjoining, backupemail, departmentid) 
            VALUES (@Name, @SpaceId, @Email, @PasswordHash, @Gender, @Status, @Role, @Phone, @Address, @DateOfJoining, @BackupEmail, @DepartmentId) 
            RETURNING empid;";
        return await _dbConnection.ExecuteScalarAsync<int>(query, user);
    }

    public async Task<bool> UpdateUserAsync(User user)
    {
        var query = @"
            UPDATE t_users 
            SET name = @Name,
                spaceid = @SpaceId, 
                email = @Email, 
                gender = @Gender, 
                status = @Status, 
                role = @Role,
                departmentid = @DepartmentId
            WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, user);
        return result > 0;
    }
    public async Task<bool> UpdateUserStatusAsync(int empId, string status)
    {
        if (empId <= 0 || string.IsNullOrWhiteSpace(status))
            return false;

        status = status.Trim();
        status = char.ToUpper(status[0]) + status.Substring(1).ToLower();

        // Accept Active, Inactive, and Pending statuses
        if (status != "Active" && status != "Inactive" && status != "Pending")
            return false;

        var existsQuery = "SELECT COUNT(1) FROM t_users WHERE empid = @EmpId";
        var exists = await _dbConnection.ExecuteScalarAsync<int>(existsQuery, new { EmpId = empId });

        if (exists == 0)
            return false;

        var query = "UPDATE t_users SET status = @Status WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, new { Status = status, EmpId = empId });

        return result > 0;
    }

    public async Task<bool> DeleteUserAsync(int empid)
    {
        var query = "DELETE FROM t_users WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, new { EmpId = empid });
        return result > 0;
    }

    public async Task<int> CreateSpaceAsync(string spaceName, int adminId)
    {
        var query = @"
            INSERT INTO t_spaces (spacename, adminid, numberofemployees, createdat, workingdays) 
            VALUES (@SpaceName, @AdminId, 100, CURRENT_TIMESTAMP, @WorkingDays) 
            RETURNING spaceid;";
        return await _dbConnection.ExecuteScalarAsync<int>(query, new { SpaceName = spaceName, AdminId = adminId, WorkingDays = "[\"Mon\",\"Tue\",\"Wed\",\"Thu\",\"Fri\"]" });
    }

    public async Task<bool> UpdateUserSpaceIdAsync(int empId, int spaceId)
    {
        var query = "UPDATE t_users SET spaceid = @SpaceId WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, new { SpaceId = spaceId, EmpId = empId });
        return result > 0;
    }

    public async Task<int> AddWarningAsync(EmployeeWarning warning)
    {
        var query = @"
            INSERT INTO t_employeewarnings (empid, warningtext, penaltyamount, issuedby) 
            VALUES (@EmpId, @WarningText, @PenaltyAmount, @IssuedBy) 
            RETURNING warningid;";
        return await _dbConnection.ExecuteScalarAsync<int>(query, warning);
    }

    public async Task<IEnumerable<EmployeeWarning>> GetWarningsByUserIdAsync(int empid)
    {
        var query = "SELECT warningid, empid, warningtext, penaltyamount, issuedby FROM t_employeewarnings WHERE empid = @EmpId";
        return await _dbConnection.QueryAsync<EmployeeWarning>(query, new { EmpId = empid });
    }

    public async Task<IEnumerable<User>> GetUsersForManagerAsync(int empId, string role, int? spaceId)
    {
        // All roles (Admin, Manager, TeamLead) should see ALL users across the company (all admin spaces)
        // This ensures correct multi-tenant isolation using the company-level query
        return await GetUsersByCompanyAsync(empId);
    }

    public async Task<IEnumerable<User>> GetUsersBySpaceIdAsync(int spaceId)
    {
        var query = @"SELECT empid, name, spaceid, email, passwordhash, gender, status, role, 
                             phone, address, COALESCE(dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                             accountnumber, bankname, accountholdername, ifsccode, upiid, backupemail 
                      FROM t_users WHERE spaceid = @SpaceId";
        return await _dbConnection.QueryAsync<User>(query, new { SpaceId = spaceId });
    }

    public async Task<IEnumerable<User>> GetUsersByAdminSpacesAsync(int adminId)
    {
        var query = @"
            SELECT u.empid, u.name, u.spaceid, u.email, u.passwordhash, u.gender, u.status, u.role, 
                   u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                   u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail
            FROM t_users u
            INNER JOIN t_spaces s ON u.spaceid = s.spaceid
            WHERE s.adminid = @AdminId
        ";
        return await _dbConnection.QueryAsync<User>(query, new { AdminId = adminId });
    }

    public async Task<IEnumerable<User>> GetUsersByCompanyAsync(int empId)
    {
        try
        {
            // Robust 3-path company query for all role types:
            // Path 1 (Admin): The caller IS an admin — fetch all users in spaces where adminid = empId
            // Path 2 (Employee/Manager/TL): The caller has a spaceid → resolve adminid from that space
            //                               → then fetch all users in spaces under that same admin
            // Both paths are UNION'd so at least one always resolves.
            var query = @"
                SELECT DISTINCT u.empid, u.name, u.spaceid, u.email, u.gender, u.status, u.role, 
                       u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                       u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail
                FROM t_users u
                INNER JOIN t_spaces s ON u.spaceid = s.spaceid
                WHERE s.adminid = @EmpId

                UNION

                SELECT DISTINCT u.empid, u.name, u.spaceid, u.email, u.gender, u.status, u.role, 
                       u.phone, u.address, COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
                       u.accountnumber, u.bankname, u.accountholdername, u.ifsccode, u.upiid, u.backupemail
                FROM t_users u
                INNER JOIN t_spaces s ON u.spaceid = s.spaceid
                WHERE s.adminid = (
                    SELECT s2.adminid
                    FROM t_spaces s2
                    INNER JOIN t_users u2 ON u2.spaceid = s2.spaceid
                    WHERE u2.empid = @EmpId
                    LIMIT 1
                )

                ORDER BY empid
            ";

            var users = await _dbConnection.QueryAsync<User>(query, new { EmpId = empId });
            return users ?? Enumerable.Empty<User>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[UserRepository.GetUsersByCompanyAsync] Error for empId={empId}: {ex.Message}");
            return Enumerable.Empty<User>();
        }
    }

    public async Task<bool> UpdateBackupEmailAsync(int empId, string backupEmail)
    {
        var query = "UPDATE t_users SET backupemail = @BackupEmail WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, new { BackupEmail = backupEmail, EmpId = empId });
        return result > 0;
    }

    public async Task<bool> UpdatePasswordHashAsync(int empId, string passwordHash)
    {
        var query = "UPDATE t_users SET passwordhash = @PasswordHash WHERE empid = @EmpId";
        var result = await _dbConnection.ExecuteAsync(query, new { PasswordHash = passwordHash, EmpId = empId });
        return result > 0;
    }

    public async Task<int> CreateOtpAsync(int empId, string otp, DateTime expiresAt)
    {
        var query = "INSERT INTO t_otp (empid, otp, expiresat, isused) VALUES (@EmpId, @Otp, @ExpiresAt, FALSE) RETURNING id;";
        return await _dbConnection.ExecuteScalarAsync<int>(query, new { EmpId = empId, Otp = otp, ExpiresAt = expiresAt });
    }

    public async Task<dynamic?> GetActiveOtpAsync(int empId, string otp)
    {
        var query = "SELECT id, empid, otp, expiresat, isused FROM t_otp WHERE empid = @EmpId AND otp = @Otp AND isused = FALSE AND expiresat > NOW() LIMIT 1";
        return await _dbConnection.QueryFirstOrDefaultAsync<dynamic>(query, new { EmpId = empId, Otp = otp });
    }

    public async Task<bool> MarkOtpAsUsedAsync(int otpId)
    {
        var query = "UPDATE t_otp SET isused = TRUE WHERE id = @OtpId";
        var result = await _dbConnection.ExecuteAsync(query, new { OtpId = otpId });
        return result > 0;
    }

    public async Task<bool> IsUserUnderAdminAsync(int targetEmpId, int adminEmpId)
    {
        var query = @"
            SELECT COUNT(1)
            FROM t_users u
            JOIN t_spaces s ON u.spaceid = s.spaceid
            WHERE u.empid = @TargetEmpId AND s.adminid = @AdminEmpId AND s.isactive = TRUE";
        var count = await _dbConnection.ExecuteScalarAsync<int>(query, new { TargetEmpId = targetEmpId, AdminEmpId = adminEmpId });
        return count > 0;
    }
}
