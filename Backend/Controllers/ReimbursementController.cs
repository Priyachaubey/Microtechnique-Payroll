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
    public class ReimbursementController : ControllerBase
    {
        private readonly string _connStr;

        public ReimbursementController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
        }

        private int? GetEmpId()
        {
            var claim = User.FindFirst("EmpId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        // Employee fetches their own claims
        [HttpGet("my")]
        public async Task<IActionResult> GetMyClaims()
        {
            var empId = GetEmpId();
            if (empId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT r.*, a.name as ApproverName
                FROM t_reimbursements r
                LEFT JOIN t_users a ON r.approved_by = a.empid
                WHERE r.empid = @EmpId
                ORDER BY r.createdat DESC
            ";
            var claims = await conn.QueryAsync<Reimbursement>(sql, new { EmpId = empId });
            return Ok(claims);
        }

        // Admin fetches all claims for the space
        [HttpGet("all")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetAllClaims()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT r.*, u.name as EmployeeName, a.name as ApproverName
                FROM t_reimbursements r
                JOIN t_users u ON r.empid = u.empid
                LEFT JOIN t_users a ON r.approved_by = a.empid
                WHERE r.spaceid = @SpaceId
                ORDER BY r.createdat DESC
            ";
            var claims = await conn.QueryAsync<Reimbursement>(sql, new { SpaceId = spaceId });
            return Ok(claims);
        }

        // Employee applies for a claim
        [HttpPost]
        public async Task<IActionResult> ApplyClaim([FromBody] Reimbursement req)
        {
            var currentEmpId = GetEmpId();
            var spaceId = GetSpaceId();
            if (currentEmpId == null || spaceId == null) return Unauthorized();

            var targetEmpId = currentEmpId;
            if ((User.IsInRole("Admin") || User.IsInRole("Manager")) && req.EmpId > 0)
            {
                targetEmpId = req.EmpId;
            }

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_reimbursements (empid, spaceid, type, amount, description, receipt_url, status)
                VALUES (@EmpId, @SpaceId, @Type, @Amount, @Description, @ReceiptUrl, 'Pending')
                RETURNING claimid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                EmpId = targetEmpId,
                SpaceId = spaceId,
                req.Type,
                req.Amount,
                req.Description,
                req.ReceiptUrl
            });

            return Ok(new { message = "Claim submitted successfully", claimId = id });
        }

        // Admin approves or rejects a claim
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateClaimStatus(int id, [FromBody] UpdateClaimReq req)
        {
            var adminId = GetEmpId();
            var spaceId = GetSpaceId();
            if (adminId == null || spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                UPDATE t_reimbursements
                SET status = @Status, approved_by = @AdminId
                WHERE claimid = @Id AND spaceid = @SpaceId
            ";

            var affected = await conn.ExecuteAsync(sql, new {
                Status = req.Status,
                AdminId = adminId,
                Id = id,
                SpaceId = spaceId
            });

            if (affected == 0) return NotFound(new { message = "Claim not found" });

            return Ok(new { message = $"Claim {req.Status.ToLower()} successfully" });
        }
    }

    public class UpdateClaimReq
    {
        public string Status { get; set; } = string.Empty;
    }
}
