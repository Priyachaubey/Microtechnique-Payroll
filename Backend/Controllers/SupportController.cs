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
    public class SupportController : ControllerBase
    {
        private readonly string _connStr;

        public SupportController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
        }

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            if (int.TryParse(claim, out var id) && id > 0)
            {
                return id;
            }
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Admin")
            {
                return GetEmpId();
            }
            return null;
        }

        private int? GetEmpId()
        {
            var claim = User.FindFirst("EmpId")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetTickets()
        {
            var empId = GetEmpId();
            var spaceId = GetSpaceId();
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (empId == null || spaceId == null) return Unauthorized();

            var isAdmin = role == "Admin" || role == "Manager";

            using var conn = new NpgsqlConnection(_connStr);
            var sql = isAdmin ? @"
                SELECT t.*, u.name as EmployeeName,
                       (SELECT COUNT(*) FROM t_ticket_replies r WHERE r.ticketid = t.ticketid) as ReplyCount
                FROM t_tickets t
                JOIN t_users u ON t.empid = u.empid
                WHERE t.spaceid = @SpaceId
                ORDER BY t.createdat DESC
            " : @"
                SELECT t.*, u.name as EmployeeName,
                       (SELECT COUNT(*) FROM t_ticket_replies r WHERE r.ticketid = t.ticketid) as ReplyCount
                FROM t_tickets t
                JOIN t_users u ON t.empid = u.empid
                WHERE t.empid = @EmpId
                ORDER BY t.createdat DESC
            ";

            var tickets = isAdmin 
                ? await conn.QueryAsync<Ticket>(sql, new { SpaceId = spaceId })
                : await conn.QueryAsync<Ticket>(sql, new { EmpId = empId });

            return Ok(tickets);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] Ticket req)
        {
            var empId = GetEmpId();
            var spaceId = GetSpaceId();
            if (empId == null || spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_tickets (spaceid, empid, subject, description, status)
                VALUES (@SpaceId, @EmpId, @Subject, @Description, 'Open')
                RETURNING ticketid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                SpaceId = spaceId,
                EmpId = empId,
                req.Subject,
                req.Description
            });

            return Ok(new { message = "Ticket created successfully", ticketId = id });
        }

        [HttpGet("{id}/replies")]
        public async Task<IActionResult> GetReplies(int id)
        {
            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT r.*, u.name as SenderName
                FROM t_ticket_replies r
                JOIN t_users u ON r.sender_empid = u.empid
                WHERE r.ticketid = @Id
                ORDER BY r.createdat ASC
            ";
            var replies = await conn.QueryAsync<TicketReply>(sql, new { Id = id });
            return Ok(replies);
        }

        [HttpPost("{id}/replies")]
        public async Task<IActionResult> AddReply(int id, [FromBody] TicketReply req)
        {
            var empId = GetEmpId();
            if (empId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_ticket_replies (ticketid, sender_empid, message)
                VALUES (@TicketId, @EmpId, @Message)
                RETURNING replyid;
            ";

            var replyId = await conn.ExecuteScalarAsync<int>(sql, new {
                TicketId = id,
                EmpId = empId,
                req.Message
            });

            return Ok(new { message = "Reply added", replyId = replyId });
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTicketReq req)
        {
            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"UPDATE t_tickets SET status = @Status WHERE ticketid = @Id";
            await conn.ExecuteAsync(sql, new { Status = req.Status, Id = id });
            return Ok(new { message = "Status updated" });
        }
    }

    public class UpdateTicketReq
    {
        public string Status { get; set; } = string.Empty;
    }
}
