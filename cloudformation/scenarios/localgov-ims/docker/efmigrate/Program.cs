using Microsoft.EntityFrameworkCore;
using Infrastructure.Data;

var connectionString = args.FirstOrDefault(a => a.StartsWith("--connection="))?.Substring("--connection=".Length)
    ?? throw new ArgumentException("Usage: efmigrate --connection=<connection-string>");

Console.WriteLine("Running EF Core migrations for GOV.UK Pay integration...");

var optionsBuilder = new DbContextOptionsBuilder<GovUkPayDbContext>();
optionsBuilder.UseSqlServer(connectionString);

using var context = new GovUkPayDbContext(optionsBuilder.Options);
context.Database.Migrate();

Console.WriteLine("EF Core migrations completed successfully.");
