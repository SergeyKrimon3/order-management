using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Persistence;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("orders", table =>
        {
            table.HasCheckConstraint(
                "ck_orders_status",
                "status IN ('pending', 'processing', 'completed')");
            table.HasCheckConstraint("ck_orders_amount", "amount > 0");
        });

        builder.HasKey(order => order.Id);

        builder.Property(order => order.Id)
            .HasColumnName("id");

        builder.Property(order => order.Customer)
            .HasColumnName("customer")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(order => order.Product)
            .HasColumnName("product")
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(order => order.Amount)
            .HasColumnName("amount")
            .HasPrecision(18, 2);

        builder.Property(order => order.Status)
            .HasColumnName("status")
            .HasConversion(
                status => status.ToString().ToLowerInvariant(),
                value => Enum.Parse<OrderStatus>(value, true))
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(order => order.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.Property(order => order.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.Property(order => order.Image)
            .HasColumnName("image")
            .HasColumnType("text");

        var createdAt = new DateTime(2026, 10, 11, 20, 4, 41, DateTimeKind.Unspecified);
        builder.HasData(
            Showcase("1f457889-3e99-4075-8802-ffec7e55026c", "Sacola", 59m, "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", createdAt),
            Showcase("e6c47824-bfa2-480c-af3d-62492c51c15f", "Fone", 189m, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", createdAt),
            Showcase("d9edd0d8-e4b3-44e9-b9a5-c96078400479", "Café", 18m, "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", createdAt),
            Showcase("8aaf135c-09c9-4672-9de5-dae6e6755ce9", "Caderno", 25m, "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80", createdAt),
            Showcase("3c980c77-ddcd-46cb-8378-d56ab404ad8f", "Bloco de notas", 14m, "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80", createdAt),
            Showcase("8e6a3d05-475d-4f18-807f-5d90e072d375", "Marcador", 9m, "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=80", createdAt));
    }

    private static object Showcase(string id, string product, decimal amount, string image, DateTime createdAt)
    {
        return new
        {
            Id = Guid.Parse(id),
            Customer = "Vitrine",
            Product = product,
            Amount = amount,
            Status = OrderStatus.Pending,
            CreatedAt = createdAt,
            UpdatedAt = createdAt,
            Image = image
        };
    }
}
