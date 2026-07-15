namespace Backend.Controllers;

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using System;
using Backend.Services;
using Backend.Models;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
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

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyAttendance()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid session token." });

        var data = await _attendanceService.GetMyAttendanceAsync(empId);
        return Ok(data);
    }

    public class ClockInRequest
    {
        public string VerificationMode { get; set; } = "Web";
    }

    [HttpPost("clock-in")]
    [Authorize]
    public async Task<IActionResult> ClockIn([FromBody] ClockInRequest? request)
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid session token." });

        var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
        string mode = request?.VerificationMode ?? "Web";

        try
        {
            var result = await _attendanceService.ClockInAsync(empId, ipAddress, mode);
            if (!result)
            {
                return BadRequest(new { message = "Already clocked in today" });
            }
            return Ok(new { message = "Clock-in successful" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("clock-out")]
    [Authorize]
    public async Task<IActionResult> ClockOut()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized(new { message = "Invalid session token." });

        try
        {
            var data = await _attendanceService.ClockOutAsync(empId);
            return Ok(data);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("user/{empid}")]
    [Authorize(Roles = "Admin,Manager,TeamLead")]
    public async Task<IActionResult> GetAttendanceByUserId(int empid)
    {
        var spaceId = GetSpaceId();
        var role = GetRole();

        try
        {
            var attendance = await _attendanceService.GetAttendanceByUserIdAsync(empid, spaceId, role);
            return Ok(new { attendance });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = ex.Message });
        }
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllAttendance()
    {
        var empId = GetEmpId();
        var spaceId = GetSpaceId();
        var role = GetRole();

        try
        {
            if (role == "Admin")
            {
                var attendance = await _attendanceService.GetAttendanceBySpaceIdAsync(spaceId, spaceId, role);
                return Ok(attendance);
            }
            else if (role == "Manager" || role == "TeamLead")
            {
                var attendance = await _attendanceService.GetAttendanceBySpaceIdAsync(spaceId, spaceId, role);
                return Ok(attendance);
            }
            else
            {
                var attendance = await _attendanceService.GetAttendanceByUserIdAsync(empId, spaceId, role);
                return Ok(attendance);
            }
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403, new { message = "Access denied." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("break-start")]
    [Authorize]
    public async Task<IActionResult> StartBreak()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized();

        try
        {
            var result = await _attendanceService.StartBreakAsync(empId);
            if (!result)
            {
                return BadRequest(new { message = "Break already started or limit reached" });
            }
            return Ok(new { message = "Break started successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("break-end")]
    [Authorize]
    public async Task<IActionResult> EndBreak()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized();

        try
        {
            var result = await _attendanceService.EndBreakAsync(empId);
            if (!result)
            {
                return BadRequest(new { message = "No active break found to end" });
            }
            return Ok(new { message = "Break ended successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("active-break")]
    [Authorize]
    public async Task<IActionResult> GetActiveBreak()
    {
        var empId = GetEmpId();
        if (empId == 0) return Unauthorized();

        var data = await _attendanceService.GetActiveBreakAsync(empId);
        return Ok(data);
    }

    [HttpDelete("test-clear")]
    [Authorize]
    public async Task<IActionResult> TestClearToday()
    {
        var empId = GetEmpId();
        await _attendanceService.TestClearTodayAsync(empId);
        return Ok(new { message = "Today's attendance cleared." });
    }

    [HttpGet("trends")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTrends([FromQuery] int? empId)
    {
        int targetEmpId = empId ?? 1;
        var data = await _attendanceService.GetTrendsAsync(targetEmpId);
        return Ok(data);
    }

    [HttpGet("holidays")]
    [Authorize]
    public async Task<IActionResult> GetHolidays()
    {
        var spaceId = GetSpaceId();
        if (spaceId == 0) return BadRequest(new { message = "Invalid space context." });
        var holidays = await _attendanceService.GetHolidaysBySpaceIdAsync(spaceId);
        return Ok(holidays);
    }

    [HttpPost("holidays")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddHoliday([FromBody] Holiday holiday)
    {
        var spaceId = GetSpaceId();
        if (spaceId == 0) return BadRequest(new { message = "Invalid space context." });
        
        holiday.SpaceId = spaceId;
        var result = await _attendanceService.AddHolidayAsync(holiday);
        if (result)
        {
            return Ok(new { message = "Holiday added successfully." });
        }
        return BadRequest(new { message = "Failed to add holiday." });
    }

    [HttpDelete("holidays/{holidayId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHoliday(int holidayId)
    {
        var spaceId = GetSpaceId();
        if (spaceId == 0) return BadRequest(new { message = "Invalid space context." });
        
        var result = await _attendanceService.DeleteHolidayAsync(holidayId, spaceId);
        if (result)
        {
            return Ok(new { message = "Holiday deleted successfully." });
        }
        return BadRequest(new { message = "Failed to delete holiday." });
    }

    public class BiometricPunchLog
    {
        public string Email { get; set; } = string.Empty;
        public DateTime PunchTime { get; set; }
        public string Mode { get; set; } = "Biometrics";
    }

    [HttpPost("sync-biometrics")]
    [AllowAnonymous] // Office local script daemon uses API key or simple header token validation. For sandbox, we support open sync.
    public async Task<IActionResult> SyncBiometrics([FromBody] List<BiometricPunchLog> punches)
    {
        if (punches == null || punches.Count == 0)
            return BadRequest(new { message = "Punch logs are required." });

        // Let's import the DB connection to bulk insert or clock in users
        // Since it's helper API for office machines:
        int count = 0;
        foreach (var p in punches)
        {
            try
            {
                // Resolve user by email
                var user = await _attendanceService.GetUserByEmailAsync(p.Email);
                if (user != null)
                {
                    // Clock them in securely under Biometrics mode
                    var success = await _attendanceService.ClockInAsync(user.EmpId, "127.0.0.1", p.Mode);
                    if (success) count++;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Biometrics Sync] Error syncing for {p.Email}: {ex.Message}");
            }
        }

        return Ok(new { message = $"Successfully synced {count} biometric punch logs.", syncedCount = count });
    }
}
