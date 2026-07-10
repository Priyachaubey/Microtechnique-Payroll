using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace Backend.Services
{
    public class LocalFileStorageService : IStorageService
    {
        private readonly IWebHostEnvironment _env;

        public LocalFileStorageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        private string GetWebRoot()
        {
            return _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName, string fileName)
        {
            var folderPath = Path.Combine(GetWebRoot(), folderName);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Path.Combine(folderName, fileName).Replace("\\", "/");
        }

        public async Task<string> SaveFileAsync(byte[] fileBytes, string folderName, string fileName)
        {
            var folderPath = Path.Combine(GetWebRoot(), folderName);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var filePath = Path.Combine(folderPath, fileName);
            await File.WriteAllBytesAsync(filePath, fileBytes);

            return Path.Combine(folderName, fileName).Replace("\\", "/");
        }

        public Task<bool> DeleteFileAsync(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return Task.FromResult(false);

            var physicalPath = Path.Combine(GetWebRoot(), relativePath.TrimStart('/', '\\'));
            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
                return Task.FromResult(true);
            }
            return Task.FromResult(false);
        }

        public Task<bool> FileExistsAsync(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return Task.FromResult(false);

            var physicalPath = Path.Combine(GetWebRoot(), relativePath.TrimStart('/', '\\'));
            return Task.FromResult(File.Exists(physicalPath));
        }

        public async Task<byte[]> ReadFileAsync(string relativePath)
        {
            var physicalPath = Path.Combine(GetWebRoot(), relativePath.TrimStart('/', '\\'));
            if (File.Exists(physicalPath))
            {
                return await File.ReadAllBytesAsync(physicalPath);
            }
            return null;
        }
    }
}
