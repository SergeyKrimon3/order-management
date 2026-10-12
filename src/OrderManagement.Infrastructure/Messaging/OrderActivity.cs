using System.Diagnostics;
using System.Text;

namespace OrderManagement.Infrastructure.Messaging;

public static class OrderActivity
{
    public const string Name = "OrderManagement";

    public const string TraceParentHeader = "traceparent";

    public static readonly ActivitySource Source = new(Name);

    public static Activity? Start(string operation, string? traceParent, ActivityKind kind)
    {
        var hasParent = ActivityContext.TryParse(traceParent, null, out var parent);
        var started = hasParent
            ? Source.StartActivity(operation, kind, parent)
            : Source.StartActivity(operation, kind);
        if (started is not null || !hasParent || string.IsNullOrWhiteSpace(traceParent))
        {
            return started;
        }

        var activity = new Activity(operation);
        activity.SetParentId(traceParent);
        activity.Start();
        return activity;
    }

    public static void ApplyHeader(IDictionary<string, object?> headers, string? traceParent)
    {
        if (string.IsNullOrWhiteSpace(traceParent))
        {
            return;
        }

        headers[TraceParentHeader] = Encoding.UTF8.GetBytes(traceParent);
    }

    public static string? ReadHeader(IDictionary<string, object?>? headers)
    {
        if (headers is null || !headers.TryGetValue(TraceParentHeader, out var value) || value is null)
        {
            return null;
        }

        return value switch
        {
            byte[] bytes => Encoding.UTF8.GetString(bytes),
            string text => text,
            _ => null
        };
    }

    public static string? CurrentTraceParent()
    {
        return Activity.Current?.Id;
    }
}
