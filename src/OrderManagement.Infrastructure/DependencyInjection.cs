using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OrderManagement.Infrastructure.Messaging;
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

        var rabbit = configuration.GetSection(RabbitMqOptions.SectionName);
        services.AddSingleton(new RabbitMqOptions
        {
            Host = rabbit["Host"] ?? "localhost",
            Port = int.TryParse(rabbit["Port"], out var port) ? port : 5672,
            Username = rabbit["Username"] ?? "orders",
            Password = rabbit["Password"] ?? "orders",
            Queue = rabbit["Queue"] ?? "order-created"
        });
        services.AddSingleton<IOrderCreatedPublisher, RabbitMqOrderCreatedPublisher>();
        services.AddScoped<OrderService>();
        services.AddScoped<OrderCreatedProcessor>();

        services.AddHealthChecks()
            .AddDbContextCheck<OrdersDbContext>("postgresql");

        return services;
    }
}
