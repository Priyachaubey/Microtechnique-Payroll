using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Ticket
    {
        public int TicketId { get; set; }
        public int SpaceId { get; set; }
        public int EmpId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = "Open";
        public DateTime CreatedAt { get; set; }
        
        public string? EmployeeName { get; set; }
        public int ReplyCount { get; set; }
    }

    public class TicketReply
    {
        public int ReplyId { get; set; }
        public int TicketId { get; set; }
        public int SenderEmpId { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        
        public string? SenderName { get; set; }
    }
}
