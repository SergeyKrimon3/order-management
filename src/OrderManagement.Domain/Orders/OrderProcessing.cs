namespace OrderManagement.Domain.Orders;

public static class OrderProcessing
{
    public static readonly TimeSpan VisiblePending = TimeSpan.FromSeconds(3);

    public static readonly TimeSpan Duration = TimeSpan.FromSeconds(5);

    public static TimeSpan RemainingPending(DateTime createdAt, DateTime now)
    {
        return RemainingUntil(createdAt, now, VisiblePending);
    }

    public static TimeSpan Remaining(DateTime processingSince, DateTime now)
    {
        return RemainingUntil(processingSince, now, Duration);
    }

    private static TimeSpan RemainingUntil(DateTime since, DateTime now, TimeSpan window)
    {
        var remaining = window - (now - since);
        return remaining > TimeSpan.Zero ? remaining : TimeSpan.Zero;
    }
}
