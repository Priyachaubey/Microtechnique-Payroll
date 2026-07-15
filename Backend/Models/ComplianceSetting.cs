using System;

namespace Backend.Models
{
    public class ComplianceSetting
    {
        public int SettingId { get; set; }
        public int SpaceId { get; set; }
        public decimal PfPercentage { get; set; }
        public decimal EsiPercentage { get; set; }
        public decimal PtAmount { get; set; }
        public decimal TdsPercentage { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
