using System;
using System.Collections.Generic;

namespace Backend.Models
{
    public class Job
    {
        public int JobId { get; set; }
        public int SpaceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Department { get; set; }
        public string Status { get; set; } = "Open";
        public DateTime CreatedAt { get; set; }
        
        public int ApplicantCount { get; set; }
    }

    public class Application
    {
        public int AppId { get; set; }
        public int JobId { get; set; }
        public string CandidateName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? ResumeUrl { get; set; }
        public string Status { get; set; } = "Applied";
        public DateTime CreatedAt { get; set; }
        
        public string? JobTitle { get; set; }
    }
}
