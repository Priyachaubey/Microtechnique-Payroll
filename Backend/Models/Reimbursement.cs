using System;

namespace Backend.Models
{
    public class Reimbursement
    {
        public int ClaimId { get; set; }
        public int EmpId { get; set; }
        public int SpaceId { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Description { get; set; }
        public string? ReceiptUrl { get; set; }
        public string Status { get; set; } = "Pending";
        public int? ApprovedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        
        // Joined fields for display
        public string? EmployeeName { get; set; }
        public string? ApproverName { get; set; }
    }
}
