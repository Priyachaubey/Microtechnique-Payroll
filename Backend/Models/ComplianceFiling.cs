using System;

namespace Backend.Models
{
    public class ComplianceFiling
    {
        public int FilingId { get; set; }
        public int SpaceId { get; set; }
        public string Type { get; set; } = string.Empty;
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal Amount { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? FiledDate { get; set; }
        public string Status { get; set; } = "Pending";
        public string? ChallanNumber { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
