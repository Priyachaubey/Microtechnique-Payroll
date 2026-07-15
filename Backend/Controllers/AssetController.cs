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
    public class AssetController : ControllerBase
    {
        private readonly string _connStr;

        public AssetController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
        }

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        private int? GetEmpId()
        {
            var claim = User.FindFirst("EmpId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAssets()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT a.*, u.name as AssignedEmployeeName
                FROM t_assets a
                LEFT JOIN t_users u ON a.assigned_empid = u.empid
                WHERE a.spaceid = @SpaceId
                ORDER BY a.createdat DESC
            ";
            var assets = await conn.QueryAsync<Asset>(sql, new { SpaceId = spaceId });
            return Ok(assets);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyAssets()
        {
            var empId = GetEmpId();
            if (empId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT * FROM t_assets
                WHERE assigned_empid = @EmpId
                ORDER BY createdat DESC
            ";
            var assets = await conn.QueryAsync<Asset>(sql, new { EmpId = empId });
            return Ok(assets);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateAsset([FromBody] Asset req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_assets (spaceid, name, type, serial_number, assigned_empid, assigned_date, status)
                VALUES (@SpaceId, @Name, @Type, @SerialNumber, @AssignedEmpId, @AssignedDate, @Status)
                RETURNING assetid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                SpaceId = spaceId,
                req.Name,
                req.Type,
                req.SerialNumber,
                req.AssignedEmpId,
                AssignedDate = req.AssignedEmpId.HasValue ? (req.AssignedDate ?? DateTime.UtcNow) : (DateTime?)null,
                Status = req.AssignedEmpId.HasValue ? "Assigned" : "Available"
            });

            return Ok(new { message = "Asset added successfully", assetId = id });
        }

        [HttpPut("{id}/assign")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AssignAsset(int id, [FromBody] AssignAssetReq req)
        {
            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                UPDATE t_assets
                SET assigned_empid = @EmpId, assigned_date = @AssignedDate, status = @Status
                WHERE assetid = @Id
            ";

            await conn.ExecuteAsync(sql, new { 
                EmpId = req.EmpId,
                AssignedDate = req.EmpId.HasValue ? DateTime.UtcNow : (DateTime?)null,
                Status = req.EmpId.HasValue ? "Assigned" : "Available",
                Id = id 
            });

            return Ok(new { message = "Asset assignment updated" });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteAsset(int id)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                DELETE FROM t_assets 
                WHERE assetid = @Id AND spaceid = @SpaceId
            ";

            var rows = await conn.ExecuteAsync(sql, new { Id = id, SpaceId = spaceId });
            if (rows == 0) return NotFound();
            
            return Ok(new { message = "Asset deleted successfully" });
        }
    }

    public class AssignAssetReq
    {
        public int? EmpId { get; set; }
    }
}
