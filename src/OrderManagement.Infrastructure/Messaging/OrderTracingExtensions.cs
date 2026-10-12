using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using OpenTelemetry.Trace;

namespace OrderManagement.Infrastructure.Messaging;

public static class OrderTracingExtensions
{
    public static IServiceCollection AddOrderTracing(this IServiceCollection services, bool includeHttpRequests)
    {
        services.AddOpenTelemetry()
            .WithTracing(tracing =>
            {
                tracing
                    .AddSource(OrderActivity.Name)
                    .AddHttpClientInstrumentation();

                if (includeHttpRequests)
                {
                    tracing.AddAspNetCoreInstrumentation(options =>
                    {
                        options.Filter = context => !context.Request.Path.StartsWithSegments("/health");
                    });
                }

                tracing.AddConsoleExporter();
            });

        return services;
    }
}
