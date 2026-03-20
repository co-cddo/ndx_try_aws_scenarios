using System;
using Microsoft.AspNet.Identity;
class Program {
    static void Main() {
        var password = Console.ReadLine();
        var hasher = new PasswordHasher();
        Console.Write(hasher.HashPassword(password));
    }
}
