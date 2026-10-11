using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace OrderManagement.Infrastructure.Persistence;

public sealed class OrdersDbContextFactory : IDesignTimeDbContextFactory<OrdersDbContext>
{
    public OrdersDbContext CreateDbContext(string[] args)
    {
        var connectionString = LocalDotEnv.TryReadOrdersConnectionString(Directory.GetCurrentDirectory())
            ?? throw new InvalidOperationException(
                "Connection string 'Orders' was not found. Create a .env file from .env.example or set ConnectionStrings__Orders.");

        var options = new DbContextOptionsBuilder<OrdersDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new OrdersDbContext(options);
    }
}
