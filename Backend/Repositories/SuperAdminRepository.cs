namespace Backend.Repositories;

using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using System.Linq;
using Dapper;

public class SuperAdminRepository : ISuperAdminRepository
{
    private readonly IDbConnection _dbConnection;

    public SuperAdminRepository(IDbConnection dbConnection)
    {
        _dbConnection = dbConnection;
    }

    private const string AdminSelectQuery = @"
        SELECT DISTINCT ON (u.email)
            u.empid,
            u.email,
            u.name,
            u.status,
            u.gender,
            COALESCE(u.statusbysuperadmin, FALSE) AS statusbysuperadmin,
            COALESCE(u.dateofjoining, CURRENT_DATE)::timestamp AS dateofjoining,
            (SELECT s.spaceid FROM t_spaces s WHERE s.adminid = u.empid ORDER BY s.spaceid LIMIT 1) AS spaceid,
            (SELECT s.spacename FROM t_spaces s WHERE s.adminid = u.empid ORDER BY s.spaceid LIMIT 1) AS spacename,
            (SELECT COUNT(1) FROM t_spaces s WHERE s.adminid = u.empid) AS currentspacecount,
            (SELECT COUNT(1) FROM t_users e INNER JOIN t_spaces s ON e.spaceid = s.spaceid WHERE s.adminid = u.empid AND e.role != 'Admin') AS currentemployeecount
        FROM t_users u
        WHERE u.role = 'Admin'
        ORDER BY u.email, u.empid DESC";

    public async Task<IEnumerable<AdminListItem>> GetAllAdminsAsync()
    {
        return await _dbConnection.QueryAsync<AdminListItem>(AdminSelectQuery);
    }

    public async Task<IEnumerable<AdminListItem>> GetPendingAdminsAsync()
    {
        var query = $"SELECT * FROM ({AdminSelectQuery}) sub WHERE sub.statusbysuperadmin = FALSE";
        return await _dbConnection.QueryAsync<AdminListItem>(query);
    }

    public async Task<AdminListItem?> GetAdminByIdAsync(int empId)
    {
        var query = $"SELECT * FROM ({AdminSelectQuery}) sub WHERE sub.empid = @EmpId";
        return await _dbConnection.QueryFirstOrDefaultAsync<AdminListItem>(query, new { EmpId = empId });
    }

    public async Task<bool> ApproveAdminAsync(int empId)
    {
        var query = @"
            UPDATE t_users 
            SET statusbysuperadmin = TRUE,
                status = 'Active'
            WHERE empid = @EmpId AND role = 'Admin'";

        var result = await _dbConnection.ExecuteAsync(query, new { EmpId = empId });
        return result > 0;
    }

    public async Task<bool> RevokeAdminAsync(int empId, string status, string reason)
    {
        if (string.IsNullOrWhiteSpace(status))
            status = "Suspended";

        var query = @"
            UPDATE t_users 
            SET statusbysuperadmin = FALSE, 
                status = @Status,
                statusreason = @Reason
            WHERE empid = @EmpId AND role = 'Admin'";

        var result = await _dbConnection.ExecuteAsync(query, new { EmpId = empId, Status = status, Reason = reason });
        return result > 0;
    }

    public async Task<bool> UpdateAdminStatusAsync(int empId, string status, string? reason)
    {
        status = status.Trim();
        status = char.ToUpper(status[0]) + status.Substring(1).ToLower();

        if (status != "Active" && status != "Inactive" && status != "Suspended")
            return false;

        var query = @"
            UPDATE t_users 
            SET status = @Status,
                statusreason = @Reason
            WHERE empid = @EmpId AND role = 'Admin'";

        var result = await _dbConnection.ExecuteAsync(query, new
        {
            EmpId = empId,
            Status = status,
            Reason = reason
        });
        return result > 0;
    }

    public async Task<bool> ToggleStatusBySuperAdminAsync(int empId, bool status)
    {
        var query = @"
            UPDATE t_users 
            SET statusbysuperadmin = @Status 
            WHERE empid = @EmpId AND role = 'Admin'";

        var result = await _dbConnection.ExecuteAsync(query, new { EmpId = empId, Status = status });
        return result > 0;
    }

    public async Task<bool> DeleteAdminAsync(int empId)
    {
        // 1. Get ALL space IDs owned by this admin
        var spaceIdsQuery = "SELECT spaceid FROM t_spaces WHERE adminid = @EmpId";
        var targetSpaceIds = (await _dbConnection.QueryAsync<int>(spaceIdsQuery, new { EmpId = empId })).ToList();

        // 2. Get all employee IDs across all these spaces, plus the admin's own ID
        var empIds = new List<int> { empId };
        if (targetSpaceIds.Any())
        {
            var empIdsQuery = "SELECT empid FROM t_users WHERE spaceid IN @SpaceIds";
            var spaceEmpIds = await _dbConnection.QueryAsync<int>(empIdsQuery, new { SpaceIds = targetSpaceIds });
            empIds.AddRange(spaceEmpIds);
        }
        empIds = empIds.Distinct().ToList();

        // 3. Delete user-level data for all affected employees
        if (empIds.Any())
        {
            var userTables = new[]
            {
                "t_employee_screenshot_logs", "t_employee_video_logs", "screenshot_config",
                "t_incentives", "t_employee_performance", "t_attendance", "employeebreaks",
                "t_leaves", "t_worklogs", "t_employeesalary", "t_allowances", "t_deductions",
                "t_payrollpayments", "t_payslips", "t_otp", "t_emp_documents", "t_employeewarnings",
                "t_wfh_permissions", "allow_camera_dates"
            };

            foreach (var table in userTables)
            {
                try { await _dbConnection.ExecuteAsync($"DELETE FROM {table} WHERE empid IN @EmpIds", new { EmpIds = empIds }); } catch { /* Ignore missing tables */ }
            }
        }

        // 4. Delete space-level data
        if (targetSpaceIds.Any())
        {
            var spaceTables = new[]
            {
                "t_project_files", "t_projecttasks", "t_projects",
                "t_space_leave_config", "t_contractpayments", "t_notices",
                "t_payslip_settings", "t_holidays"
            };

            foreach (var table in spaceTables)
            {
                if (table.StartsWith("t_project"))
                {
                    try { await _dbConnection.ExecuteAsync($"DELETE FROM {table} WHERE projectid IN (SELECT projectid FROM t_projects WHERE spaceid IN @SpaceIds)", new { SpaceIds = targetSpaceIds }); } catch { }
                }
                else
                {
                    try { await _dbConnection.ExecuteAsync($"DELETE FROM {table} WHERE spaceid IN @SpaceIds", new { SpaceIds = targetSpaceIds }); } catch { }
                }
            }

            // Delete users from the spaces (if any are left)
            await _dbConnection.ExecuteAsync("DELETE FROM t_users WHERE spaceid IN @SpaceIds", new { SpaceIds = targetSpaceIds });
            // Delete the spaces themselves
            await _dbConnection.ExecuteAsync("DELETE FROM t_spaces WHERE spaceid IN @SpaceIds", new { SpaceIds = targetSpaceIds });
        }

        // 5. Finally, delete the admin user record itself (if it wasn't deleted in step 4 because spaceid was null)
        await _dbConnection.ExecuteAsync("DELETE FROM t_users WHERE empid = @EmpId", new { EmpId = empId });

        return true;
    }

    public async Task<bool> UpdateSpaceLimitsAsync(int spaceId, int? numberOfEmployees, int? maxSpaces)
    {
        var setClauses = new List<string>();
        var parameters = new DynamicParameters();
        parameters.Add("SpaceId", spaceId);

        if (numberOfEmployees.HasValue)
        {
            setClauses.Add("numberofemployees = @NumberOfEmployees");
            parameters.Add("NumberOfEmployees", numberOfEmployees.Value);
        }

        if (maxSpaces.HasValue)
        {
            setClauses.Add("maxspaces = @MaxSpaces");
            parameters.Add("MaxSpaces", maxSpaces.Value);
        }

        if (setClauses.Count == 0)
            return false;

        var query = $"UPDATE t_spaces SET {string.Join(", ", setClauses)} WHERE spaceid = @SpaceId";
        var result = await _dbConnection.ExecuteAsync(query, parameters);
        return result > 0;
    }

    public async Task<PlatformStats> GetPlatformStatsAsync()
    {
        var query = @"
            SELECT 
                (SELECT COUNT(1) FROM t_users WHERE role = 'Admin') AS totaladmins,
                (SELECT COUNT(1) FROM t_users WHERE role = 'Admin' AND status = 'Active' AND COALESCE(statusbysuperadmin, FALSE) = TRUE) AS activeadmins,
                (SELECT COUNT(1) FROM t_users WHERE role = 'Admin' AND COALESCE(statusbysuperadmin, FALSE) = FALSE) AS pendingadmins,
                (SELECT COUNT(1) FROM t_users WHERE role = 'Admin' AND status = 'Suspended') AS suspendedadmins,
                (SELECT COUNT(1) FROM t_users WHERE role = 'Admin' AND status = 'Inactive') AS inactiveadmins,
                (SELECT COUNT(1) FROM t_spaces) AS totalspaces,
                (SELECT COUNT(1) FROM t_users WHERE role NOT IN ('Admin', 'SuperAdmin')) AS totalemployees,
                (SELECT COUNT(1) FROM t_users WHERE role NOT IN ('Admin', 'SuperAdmin') AND status = 'Active') AS activeemployees,
                (SELECT COUNT(1) FROM t_users WHERE role NOT IN ('Admin', 'SuperAdmin') AND status = 'Pending') AS pendingemployees";

        return await _dbConnection.QueryFirstOrDefaultAsync<PlatformStats>(query) ?? new PlatformStats();
    }

    public async Task<SuperAdmin?> GetSuperAdminByEmailAsync(string email)
    {
        // Match emails case-insensitively so SuperAdmin auth and OTP flows behave like regular users.
        var query = "SELECT * FROM t_superadmins WHERE LOWER(email) = LOWER(@Email) LIMIT 1";
        return await _dbConnection.QueryFirstOrDefaultAsync<SuperAdmin>(query, new { Email = email });
    }

    public async Task<SuperAdmin?> GetSuperAdminByIdAsync(int id)
    {
        var query = "SELECT * FROM t_superadmins WHERE id = @Id LIMIT 1";
        return await _dbConnection.QueryFirstOrDefaultAsync<SuperAdmin>(query, new { Id = id });
    }

    public async Task<bool> UpdateSuperAdminAsync(SuperAdmin superAdmin)
    {
        var query = @"
            UPDATE t_superadmins
            SET email = @Email,
                name = @Name,
                passwordhash = @PasswordHash,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = @Id";
        var result = await _dbConnection.ExecuteAsync(query, superAdmin);
        return result > 0;
    }

    public async Task<int> CreateSuperAdminAsync(string email, string name, string passwordHash)
    {
        var query = @"
            INSERT INTO t_superadmins (email, name, passwordhash)
            VALUES (@Email, @Name, @PasswordHash)
            RETURNING id";
        return await _dbConnection.ExecuteScalarAsync<int>(query, new { Email = email, Name = name, PasswordHash = passwordHash });
    }

    public async Task<string> GetGlobalConfigAsync(string key)
    {
        var query = "SELECT config_value FROM t_global_configs WHERE config_key = @Key LIMIT 1";
        var val = await _dbConnection.QueryFirstOrDefaultAsync<string>(query, new { Key = key });
        return val ?? "";
    }

    public async Task<bool> UpdateGlobalConfigAsync(string key, string value)
    {
        var query = @"
            INSERT INTO t_global_configs (config_key, config_value, updated_at)
            VALUES (@Key, @Value, CURRENT_TIMESTAMP)
            ON CONFLICT (config_key) 
            DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = EXCLUDED.updated_at";
        var result = await _dbConnection.ExecuteAsync(query, new { Key = key, Value = value });
        return result > 0;
    }
}
