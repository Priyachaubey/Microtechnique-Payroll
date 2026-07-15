using System;

namespace Backend.Models
{
    public class Asset
    {
        public int AssetId { get; set; }
        public int SpaceId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Type { get; set; }
        public string? SerialNumber { get; set; }
        public int? AssignedEmpId { get; set; }
        public DateTime? AssignedDate { get; set; }
        public string Status { get; set; } = "Available";
        public DateTime CreatedAt { get; set; }
        
        public string? AssignedEmployeeName { get; set; }
    }
}
