using System;

namespace PayrollSystem.Models
{
    public class Department
    {
        public int DepartmentId { get; set; }
        public int SpaceId { get; set; }
        public string Name { get; set; }
        public int AdminId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
