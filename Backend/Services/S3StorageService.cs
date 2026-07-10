using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Backend.Services
{
    public class S3StorageService : IStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;

        public S3StorageService(IConfiguration configuration)
        {
            var accessKey = configuration["AWS:AccessKey"];
            var secretKey = configuration["AWS:SecretKey"];
            var region = configuration["AWS:Region"];
            _bucketName = configuration["AWS:BucketName"];

            if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey) || string.IsNullOrEmpty(_bucketName))
            {
                throw new InvalidOperationException("AWS S3 credentials or bucket name are missing in configuration.");
            }

            var awsRegion = Amazon.RegionEndpoint.GetBySystemName(region ?? "us-east-1");
            _s3Client = new AmazonS3Client(accessKey, secretKey, awsRegion);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string folderName, string fileName)
        {
            var objectKey = $"{folderName}/{fileName}".Replace("\\", "/");

            using (var newMemoryStream = new MemoryStream())
            {
                await file.CopyToAsync(newMemoryStream);
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = newMemoryStream,
                    Key = objectKey,
                    BucketName = _bucketName,
                    ContentType = file.ContentType
                };

                var fileTransferUtility = new TransferUtility(_s3Client);
                await fileTransferUtility.UploadAsync(uploadRequest);
            }

            return objectKey;
        }

        public async Task<string> SaveFileAsync(byte[] fileBytes, string folderName, string fileName)
        {
            var objectKey = $"{folderName}/{fileName}".Replace("\\", "/");

            using (var stream = new MemoryStream(fileBytes))
            {
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = stream,
                    Key = objectKey,
                    BucketName = _bucketName
                };

                var fileTransferUtility = new TransferUtility(_s3Client);
                await fileTransferUtility.UploadAsync(uploadRequest);
            }

            return objectKey;
        }

        public async Task<bool> DeleteFileAsync(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return false;

            try
            {
                var objectKey = relativePath.Replace("\\", "/").TrimStart('/');
                var deleteObjectRequest = new Amazon.S3.Model.DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = objectKey
                };

                await _s3Client.DeleteObjectAsync(deleteObjectRequest);
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> FileExistsAsync(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return false;

            try
            {
                var objectKey = relativePath.Replace("\\", "/").TrimStart('/');
                var request = new Amazon.S3.Model.GetObjectMetadataRequest
                {
                    BucketName = _bucketName,
                    Key = objectKey
                };
                await _s3Client.GetObjectMetadataAsync(request);
                return true;
            }
            catch (Amazon.S3.AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return false;
            }
        }

        public async Task<byte[]> ReadFileAsync(string relativePath)
        {
            if (string.IsNullOrEmpty(relativePath)) return null;

            try
            {
                var objectKey = relativePath.Replace("\\", "/").TrimStart('/');
                var request = new Amazon.S3.Model.GetObjectRequest
                {
                    BucketName = _bucketName,
                    Key = objectKey
                };

                using var response = await _s3Client.GetObjectAsync(request);
                using var ms = new MemoryStream();
                await response.ResponseStream.CopyToAsync(ms);
                return ms.ToArray();
            }
            catch
            {
                return null;
            }
        }
    }
}
