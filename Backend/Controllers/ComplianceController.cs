using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Dapper;
using Npgsql;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ComplianceController : ControllerBase
    {
        private readonly string _connStr;

        public ComplianceController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
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

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            if (claim != null && int.TryParse(claim, out int spaceId) && spaceId > 0)
            {
                return spaceId;
            }
            
            try 
            {
                int empId = GetCurrentUserId();
                using var connection = new NpgsqlConnection(_connStr);
                // Dapper ExecuteScalar auto-opens connection if closed
                var dbSpaceId = connection.ExecuteScalar<int?>("SELECT spaceid FROM t_users WHERE empid = @EmpId", new { EmpId = empId });
                if (dbSpaceId.HasValue && dbSpaceId.Value > 0) 
                {
                    return dbSpaceId.Value;
                }
            }
            catch 
            {
                // Fallthrough to null
            }
            return null;
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var setting = await conn.QueryFirstOrDefaultAsync<ComplianceSetting>(
                "SELECT * FROM t_compliance_settings WHERE spaceid = @SpaceId",
                new { SpaceId = spaceId }
            );

            if (setting == null)
            {
                // Return default settings
                setting = new ComplianceSetting { SpaceId = spaceId.Value, PfPercentage = 12, EsiPercentage = 0.75m, PtAmount = 200, TdsPercentage = 10 };
            }
            return Ok(setting);
        }

        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] ComplianceSetting req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_compliance_settings (spaceid, pf_percentage, esi_percentage, pt_amount, tds_percentage)
                VALUES (@SpaceId, @PfPercentage, @EsiPercentage, @PtAmount, @TdsPercentage)
                ON CONFLICT (spaceid) 
                DO UPDATE SET 
                    pf_percentage = EXCLUDED.pf_percentage,
                    esi_percentage = EXCLUDED.esi_percentage,
                    pt_amount = EXCLUDED.pt_amount,
                    tds_percentage = EXCLUDED.tds_percentage;
            ";

            await conn.ExecuteAsync(sql, new {
                SpaceId = spaceId,
                req.PfPercentage,
                req.EsiPercentage,
                req.PtAmount,
                req.TdsPercentage
            });

            return Ok(new { message = "Settings updated successfully" });
        }

        [HttpGet("filings")]
        public async Task<IActionResult> GetFilings()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var filings = await conn.QueryAsync<ComplianceFiling>(
                "SELECT * FROM t_compliance_filings WHERE spaceid = @SpaceId ORDER BY duedate DESC",
                new { SpaceId = spaceId }
            );
            return Ok(filings);
        }

        [HttpPost("filings")]
        public async Task<IActionResult> AddFiling([FromBody] ComplianceFiling req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_compliance_filings (spaceid, type, month, year, amount, duedate, status, challan_number, fileddate)
                VALUES (@SpaceId, @Type, @Month, @Year, @Amount, @DueDate, @Status, @ChallanNumber, @FiledDate)
                RETURNING filingid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                SpaceId = spaceId,
                req.Type,
                req.Month,
                req.Year,
                req.Amount,
                req.DueDate,
                req.Status,
                req.ChallanNumber,
                req.FiledDate
            });

            return Ok(new { message = "Filing added successfully", filingId = id });
        }

        [HttpPut("filings/{id}")]
        public async Task<IActionResult> UpdateFiling(int id, [FromBody] ComplianceFiling req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                UPDATE t_compliance_filings
                SET status = @Status, challan_number = @ChallanNumber, fileddate = @FiledDate, amount = @Amount
                WHERE filingid = @Id AND spaceid = @SpaceId
            ";

            await conn.ExecuteAsync(sql, new {
                Id = id,
                SpaceId = spaceId,
                req.Status,
                req.ChallanNumber,
                req.FiledDate,
                req.Amount
            });

            return Ok(new { message = "Filing updated" });
        }

        [HttpDelete("filings/{id}")]
        public async Task<IActionResult> DeleteFiling(int id)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            await conn.ExecuteAsync("DELETE FROM t_compliance_filings WHERE filingid = @Id AND spaceid = @SpaceId", new { Id = id, SpaceId = spaceId });
            return Ok(new { message = "Filing deleted" });
        }
    }
}
