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
    public class RecruitmentController : ControllerBase
    {
        private readonly string _connStr;

        public RecruitmentController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
        }

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        [HttpGet("jobs")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetJobs()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT j.*, 
                       (SELECT COUNT(*) FROM t_applications a WHERE a.jobid = j.jobid) as ApplicantCount
                FROM t_jobs j
                WHERE j.spaceid = @SpaceId
                ORDER BY j.createdat DESC
            ";
            var jobs = await conn.QueryAsync<Job>(sql, new { SpaceId = spaceId });
            return Ok(jobs);
        }

        [HttpPost("jobs")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateJob([FromBody] Job req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_jobs (spaceid, title, description, department, status)
                VALUES (@SpaceId, @Title, @Description, @Department, 'Open')
                RETURNING jobid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                SpaceId = spaceId,
                req.Title,
                req.Description,
                req.Department
            });

            return Ok(new { message = "Job created successfully", jobId = id });
        }

        [HttpGet("applications")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> GetApplications()
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT a.*, j.title as JobTitle
                FROM t_applications a
                JOIN t_jobs j ON a.jobid = j.jobid
                WHERE j.spaceid = @SpaceId
                ORDER BY a.createdat DESC
            ";
            var apps = await conn.QueryAsync<Application>(sql, new { SpaceId = spaceId });
            return Ok(apps);
        }

        [HttpPost("applications")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> AddApplication([FromBody] Application req)
        {
            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                INSERT INTO t_applications (jobid, candidate_name, email, resume_url, status)
                VALUES (@JobId, @CandidateName, @Email, @ResumeUrl, 'Applied')
                RETURNING appid;
            ";

            var id = await conn.ExecuteScalarAsync<int>(sql, new {
                req.JobId,
                req.CandidateName,
                req.Email,
                req.ResumeUrl
            });

            return Ok(new { message = "Application added successfully", appId = id });
        }

        [HttpPut("applications/{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateApplicationStatus(int id, [FromBody] UpdateAppReq req)
        {
            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                UPDATE t_applications
                SET status = @Status
                WHERE appid = @Id
            ";

            await conn.ExecuteAsync(sql, new { Status = req.Status, Id = id });
            return Ok(new { message = "Status updated" });
        }
        [HttpPut("jobs/{id}/status")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateJobStatus(int id, [FromBody] UpdateJobStatusReq req)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                UPDATE t_jobs
                SET status = @Status
                WHERE jobid = @Id AND spaceid = @SpaceId
            ";

            await conn.ExecuteAsync(sql, new { Status = req.Status, Id = id, SpaceId = spaceId });
            return Ok(new { message = "Job status updated" });
        }
    }

    public class UpdateAppReq
    {
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateJobStatusReq
    {
        public string Status { get; set; } = string.Empty;
        public string? Assignee { get; set; }
    }
}
