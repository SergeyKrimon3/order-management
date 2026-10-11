namespace OrderManagement.Domain.Orders;

public static class OrderProcessing
{
    public static readonly TimeSpan Duration = TimeSpan.FromSeconds(5);

    public static TimeSpan Remaining(DateTime processingSince, DateTime now)
    {
        var remaining = Duration - (now - processingSince);
        return remaining > TimeSpan.Zero ? remaining : TimeSpan.Zero;
    }
}
