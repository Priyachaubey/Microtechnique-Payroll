using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Backend.Services
{
    public interface IStorageService
    {
        Task<string> SaveFileAsync(IFormFile file, string folderName, string fileName);
        Task<string> SaveFileAsync(byte[] fileBytes, string folderName, string fileName);
        Task<bool> DeleteFileAsync(string relativePath);
        Task<bool> FileExistsAsync(string relativePath);
        Task<byte[]> ReadFileAsync(string relativePath);
    }
}
