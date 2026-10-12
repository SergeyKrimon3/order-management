namespace OrderManagement.Infrastructure.Insights;

public sealed class OrderQuestionException : Exception
{
    public OrderQuestionException(string message)
        : base(message)
    {
    }
}
