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
                "status IN ('Pendente', 'Processando', 'Finalizado')");
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
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(order => order.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
    }
}
