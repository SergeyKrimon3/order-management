namespace OrderManagement.Domain.Orders;

public sealed class Order
{
    public Guid Id { get; private set; }

    public string Customer { get; private set; } = string.Empty;

    public string Product { get; private set; } = string.Empty;

    public decimal Amount { get; private set; }

    public OrderStatus Status { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public DateTime UpdatedAt { get; private set; }

    public string? Image { get; private set; }

    private Order()
    {
    }

    public static Order Create(string customer, string product, decimal amount, string? image = null)
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

        var now = BrazilTime.Now();
        return new Order
        {
            Id = Guid.NewGuid(),
            Customer = customer.Trim(),
            Product = product.Trim(),
            Amount = decimal.Round(amount, 2, MidpointRounding.AwayFromZero),
            Status = OrderStatus.Pending,
            CreatedAt = now,
            UpdatedAt = now,
            Image = NormalizeImage(image)
        };
    }

    private static string? NormalizeImage(string? image)
    {
        if (string.IsNullOrWhiteSpace(image))
        {
            return null;
        }

        var trimmed = image.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != "data"))
        {
            throw new ArgumentException("Image must be an absolute URL.", nameof(image));
        }

        return trimmed;
    }

    public void MarkAsProcessing()
    {
        MoveTo(OrderStatus.Pending, OrderStatus.Processing);
    }

    public void MarkAsCompleted()
    {
        MoveTo(OrderStatus.Processing, OrderStatus.Completed);
    }

    private void MoveTo(OrderStatus required, OrderStatus next)
    {
        if (Status != required)
        {
            throw new InvalidOperationException($"Order cannot move from {Status} to {next}.");
        }

        Status = next;
        UpdatedAt = BrazilTime.Now();
    }
}
