using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using OrderManagement.Infrastructure.Favorites;
using OrderManagement.Infrastructure.Insights;
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
            Username = rabbit["Username"] ?? "admin",
            Password = rabbit["Password"] ?? "admin",
            Queue = rabbit["Queue"] ?? "order-created",
            StatusQueue = rabbit["StatusQueue"] ?? "order-status-changed"
        });
        services.AddSingleton<IOrderCreatedPublisher, RabbitMqOrderCreatedPublisher>();
        services.AddSingleton<IOrderStatusChangedPublisher, RabbitMqOrderStatusChangedPublisher>();
        services.AddScoped<OrderService>();
        services.AddScoped<FavoriteService>();
        services.AddScoped<OrderCreatedProcessor>();

        var llm = configuration.GetSection(LlmOptions.SectionName);
        services.AddSingleton(new LlmOptions
        {
            BaseUrl = llm["BaseUrl"] ?? "https://api.openai.com/v1",
            ApiKey = llm["ApiKey"] ?? "",
            Model = llm["Model"] ?? "gpt-4o-mini"
        });
        services.AddHttpClient(LlmOrderAnswerer.HttpClientName, client =>
        {
            client.Timeout = TimeSpan.FromSeconds(60);
        });
        services.AddScoped<IOrderAnswerer, LlmOrderAnswerer>();
        services.AddScoped<OrderInsightService>();

        services.AddHealthChecks()
            .AddDbContextCheck<OrdersDbContext>("postgresql")
            .AddCheck<RabbitMqHealthCheck>("rabbitmq");

        return services;
    }
}
