using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Dapper;
using Npgsql;
using Microsoft.AspNetCore.Authorization;
using System.Text;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager")]
    public class IntegrationsController : ControllerBase
    {
        private readonly string _connStr;

        public IntegrationsController(IConfiguration config)
        {
            _connStr = config.GetConnectionString("DefaultConnection") ?? "";
        }

        private int? GetSpaceId()
        {
            var claim = User.FindFirst("SpaceId")?.Value;
            return claim != null ? int.Parse(claim) : null;
        }

        [HttpGet("export/tally")]
        public async Task<IActionResult> ExportTallyXML([FromQuery] int month, [FromQuery] int year)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT u.name, u.empid, s.finalamount as net, s.baseamount as gross, s.totaldeduction as deductions
                FROM t_payslips s
                JOIN t_users u ON s.empid = u.empid
                WHERE u.spaceid = @SpaceId AND s.month = @Month AND s.year = @Year
            ";

            var slips = await conn.QueryAsync(sql, new { SpaceId = spaceId, Month = month, Year = year });

            var xml = new StringBuilder();
            xml.AppendLine("<ENVELOPE>");
            xml.AppendLine("  <HEADER>");
            xml.AppendLine("    <TALLYREQUEST>Import Data</TALLYREQUEST>");
            xml.AppendLine("  </HEADER>");
            xml.AppendLine("  <BODY>");
            xml.AppendLine("    <IMPORTDATA>");
            xml.AppendLine("      <REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>");
            xml.AppendLine("      <REQUESTDATA>");
            
            foreach(var slip in slips)
            {
                xml.AppendLine("        <TALLYMESSAGE xmlns:UDF=\"TallyUDF\">");
                xml.AppendLine("          <VOUCHER VCHTYPE=\"Journal\" ACTION=\"Create\">");
                xml.AppendLine($"            <DATE>{year}{month:00}01</DATE>");
                xml.AppendLine($"            <NARRATION>Salary for {slip.name} - {month}/{year}</NARRATION>");
                xml.AppendLine($"            <VOUCHERTYPENAME>Journal</VOUCHERTYPENAME>");
                xml.AppendLine("          </VOUCHER>");
                xml.AppendLine("        </TALLYMESSAGE>");
            }

            xml.AppendLine("      </REQUESTDATA>");
            xml.AppendLine("    </IMPORTDATA>");
            xml.AppendLine("  </BODY>");
            xml.AppendLine("</ENVELOPE>");

            return File(Encoding.UTF8.GetBytes(xml.ToString()), "application/xml", $"Tally_Export_{month}_{year}.xml");
        }

        [HttpGet("export/zoho")]
        public async Task<IActionResult> ExportZohoCSV([FromQuery] int month, [FromQuery] int year)
        {
            var spaceId = GetSpaceId();
            if (spaceId == null) return Unauthorized();

            using var conn = new NpgsqlConnection(_connStr);
            var sql = @"
                SELECT u.name, u.email, s.finalamount as net, s.baseamount as gross
                FROM t_payslips s
                JOIN t_users u ON s.empid = u.empid
                WHERE u.spaceid = @SpaceId AND s.month = @Month AND s.year = @Year
            ";

            var slips = await conn.QueryAsync(sql, new { SpaceId = spaceId, Month = month, Year = year });

            var csv = new StringBuilder();
            csv.AppendLine("Employee Name,Email,Gross Amount,Net Amount");
            
            foreach(var slip in slips)
            {
                csv.AppendLine($"{slip.name},{slip.email},{slip.gross},{slip.net}");
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"Zoho_Export_{month}_{year}.csv");
        }
    }
}
