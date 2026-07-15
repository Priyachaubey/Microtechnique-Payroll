using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Dapper;
using PayrollSystem.Models;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PayrollSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DepartmentController : ControllerBase
    {
        private readonly string _connectionString;

        public DepartmentController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("EmpId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            throw new Exception("User ID not found in token");
        }

        private int GetCurrentSpaceId()
        {
            var spaceIdClaim = User.FindFirst("SpaceId");
            if (spaceIdClaim != null && int.TryParse(spaceIdClaim.Value, out int spaceId) && spaceId > 0)
            {
                return spaceId;
            }
            // Fallback for older tokens missing SpaceId
            int empId = GetCurrentUserId();
            using var connection = new NpgsqlConnection(_connectionString);
            var dbSpaceId = connection.ExecuteScalar<int?>("SELECT spaceid FROM t_users WHERE empid = @EmpId", new { EmpId = empId });
            if (dbSpaceId.HasValue && dbSpaceId.Value > 0) 
            {
                return dbSpaceId.Value;
            }
            throw new Exception("Space ID not found in token");
        }

        private string GetCurrentUserRole()
        {
            var roleClaim = User.FindFirst(ClaimTypes.Role);
            return roleClaim?.Value ?? "";
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            try
            {
                int spaceId = GetCurrentSpaceId();
                using var connection = new NpgsqlConnection(_connectionString);
                var departments = await connection.QueryAsync<Department>(
                    "SELECT * FROM t_departments WHERE spaceid = @SpaceId ORDER BY name", 
                    new { SpaceId = spaceId });
                return Ok(departments);
            }
            catch (Exception ex)
            {
                Console.WriteLine("GetDepartments ERROR: " + ex.ToString());
                return StatusCode(500, new { message = "Error fetching departments", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateDepartment([FromBody] Department req)
        {
            try
            {
                string role = GetCurrentUserRole();
                if (role != "Admin" && role != "SuperAdmin") return Forbid();

                int spaceId = GetCurrentSpaceId();
                int adminId = GetCurrentUserId();

                using var connection = new NpgsqlConnection(_connectionString);
                var sql = @"
                    INSERT INTO t_departments (spaceid, name, adminid, createdat) 
                    VALUES (@SpaceId, @Name, @AdminId, CURRENT_TIMESTAMP) 
                    RETURNING departmentid";
                
                var newId = await connection.ExecuteScalarAsync<int>(sql, new { 
                    SpaceId = spaceId, 
                    Name = req.Name, 
                    AdminId = adminId 
                });

                req.DepartmentId = newId;
                req.SpaceId = spaceId;
                req.AdminId = adminId;
                
                return Ok(new { message = "Department created successfully", department = req });
            }
            catch (Exception ex)
            {
                Console.WriteLine("CreateDepartment ERROR: " + ex.ToString());
                return StatusCode(500, new { message = "Error creating department", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            try
            {
                string role = GetCurrentUserRole();
                if (role != "Admin" && role != "SuperAdmin") return Forbid();

                int spaceId = GetCurrentSpaceId();

                using var connection = new NpgsqlConnection(_connectionString);
                
                // Set users in this department to null
                await connection.ExecuteAsync(
                    "UPDATE t_users SET departmentid = NULL WHERE departmentid = @Id AND spaceid = @SpaceId",
                    new { Id = id, SpaceId = spaceId });

                var result = await connection.ExecuteAsync(
                    "DELETE FROM t_departments WHERE departmentid = @Id AND spaceid = @SpaceId", 
                    new { Id = id, SpaceId = spaceId });

                if (result == 0) return NotFound(new { message = "Department not found" });

                return Ok(new { message = "Department deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting department", error = ex.Message });
            }
        }
    }
}
