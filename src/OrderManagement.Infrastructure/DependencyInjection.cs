using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OrderManagement.Infrastructure.Orders;
using OrderManagement.Infrastructure.Persistence;

namespace OrderManagement.Infrastructure;

public static class DependencyInjection
{
    public const string OrdersConnectionStringName = "Orders";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(OrdersConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Connection string 'Orders' was not found. Set ConnectionStrings__Orders or create a .env file from .env.example.");
        }

        services.AddDbContext<OrdersDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<OrderService>();

        services.AddHealthChecks()
            .AddDbContextCheck<OrdersDbContext>("postgresql");

        return services;
    }
}
