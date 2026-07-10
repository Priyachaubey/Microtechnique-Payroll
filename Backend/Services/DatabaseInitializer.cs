using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Backend.Services
{
    public class DatabaseInitializer
    {
        private readonly string _connectionString;

        public DatabaseInitializer(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                                ?? throw new InvalidOperationException("DefaultConnection string is missing.");
        }

        public async Task InitializeAsync()
        {
            try
            {
                using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                // 1. Check if the database has been initialized by looking for the t_users table
                bool isInitialized = false;
                using (var cmd = new NpgsqlCommand("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 't_users');", conn))
                {
                    isInitialized = (bool)(await cmd.ExecuteScalarAsync() ?? false);
                }

                if (!isInitialized)
                {
                    Console.WriteLine("[DatabaseInitializer] Fresh database detected. Running full schema and seed script...");
                    
                    var sqlFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "COMPLETE_SCHEMA_AND_SEED.sql");
                    
                    // Fallback to project root if running from source instead of compiled bin
                    if (!File.Exists(sqlFilePath))
                    {
                        sqlFilePath = Path.Combine(Directory.GetCurrentDirectory(), "COMPLETE_SCHEMA_AND_SEED.sql");
                    }

                    if (File.Exists(sqlFilePath))
                    {
                        var sql = await File.ReadAllTextAsync(sqlFilePath);
                        
                        using var transaction = await conn.BeginTransactionAsync();
                        try
                        {
                            using var seedCmd = new NpgsqlCommand(sql, conn, transaction);
                            await seedCmd.ExecuteNonQueryAsync();
                            await transaction.CommitAsync();
                            Console.WriteLine("[DatabaseInitializer] Successfully applied complete schema and seed.");
                        }
                        catch (Exception ex)
                        {
                            await transaction.RollbackAsync();
                            Console.WriteLine($"[DatabaseInitializer] CRITICAL ERROR applying schema: {ex.Message}");
                            throw;
                        }
                    }
                    else
                    {
                        Console.WriteLine("[DatabaseInitializer] WARNING: COMPLETE_SCHEMA_AND_SEED.sql not found! Cannot auto-initialize.");
                    }
                }
                else
                {
                    Console.WriteLine("[DatabaseInitializer] Database is already initialized. Skipping auto-seed.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DatabaseInitializer] Failed to connect to database for initialization: {ex.Message}");
                // We don't throw here to allow the app to boot up even if DB is down (health checks can handle it)
            }
        }
    }
}
