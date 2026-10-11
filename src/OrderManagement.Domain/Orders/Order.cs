namespace OrderManagement.Domain.Orders;

public sealed class Order
{
    public Guid Id { get; private set; }

    public string Customer { get; private set; } = string.Empty;

    public string Product { get; private set; } = string.Empty;

    public decimal Amount { get; private set; }

    public OrderStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    private Order()
    {
    }

    public static Order Create(string customer, string product, decimal amount)
    {
        if (string.IsNullOrWhiteSpace(customer))
        {
            throw new ArgumentException("Customer is required.", nameof(customer));
        }

        if (string.IsNullOrWhiteSpace(product))
        {
            throw new ArgumentException("Product is required.", nameof(product));
        }

        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be greater than zero.");
        }

        return new Order
        {
            Id = Guid.CreateVersion7(),
            Customer = customer.Trim(),
            Product = product.Trim(),
            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero),
            Status = OrderStatus.Pendente,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void MarkAsProcessing()
    {
        MoveTo(OrderStatus.Pendente, OrderStatus.Processando);
    }

    public void MarkAsFinished()
    {
        MoveTo(OrderStatus.Processando, OrderStatus.Finalizado);
    }

    private void MoveTo(OrderStatus required, OrderStatus next)
    {
        if (Status != required)
        {
            throw new InvalidOperationException($"Order cannot move from {Status} to {next}.");
        }

        Status = next;
    }
}
