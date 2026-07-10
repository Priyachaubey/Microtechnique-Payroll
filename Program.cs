using Microsoft.AspNetCore.Identity; class Program { static void Main() { var hasher = new PasswordHasher<object>(); System.Console.WriteLine(hasher.HashPassword(new object(), "Ashu@1904")); } }
