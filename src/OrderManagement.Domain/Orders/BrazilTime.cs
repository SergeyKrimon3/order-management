namespace OrderManagement.Domain.Orders;

public static class BrazilTime
{
    private static readonly TimeZoneInfo Zone = ResolveZone();

    public static DateTime Now()
    {
        var local = TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, Zone);
        return DateTime.SpecifyKind(local.DateTime, DateTimeKind.Unspecified);
    }

    private static TimeZoneInfo ResolveZone()
    {
        if (TimeZoneInfo.TryFindSystemTimeZoneById("America/Sao_Paulo", out var zone))
        {
            return zone;
        }

        if (TimeZoneInfo.TryFindSystemTimeZoneById("E. South America Standard Time", out zone))
        {
            return zone;
        }

        return TimeZoneInfo.CreateCustomTimeZone(
            "America/Sao_Paulo",
            TimeSpan.FromHours(-3),
            "Horário de Brasília",
            "Horário de Brasília");
    }
}
