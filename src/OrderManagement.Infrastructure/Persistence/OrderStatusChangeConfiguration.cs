using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Persistence;

public sealed class OrderStatusChangeConfiguration : IEntityTypeConfiguration<OrderStatusChange>
{
    public void Configure(EntityTypeBuilder<OrderStatusChange> builder)
    {
        builder.ToTable("order_status_history", table =>
        {
            table.HasCheckConstraint(
                "ck_order_status_history_status",
                "status IN ('pending', 'processing', 'completed')");
        });

        builder.HasKey(change => change.Id);

        builder.Property(change => change.Id)
            .HasColumnName("id")
            .UseIdentityByDefaultColumn();

        builder.Property(change => change.OrderId)
            .HasColumnName("order_id")
            .IsRequired();

        builder.Property(change => change.Status)
            .HasColumnName("status")
            .HasConversion(
                status => status.ToString().ToLowerInvariant(),
                value => Enum.Parse<OrderStatus>(value, true))
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(change => change.OccurredAt)
            .HasColumnName("occurred_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.HasIndex(change => new { change.OrderId, change.OccurredAt });

        builder.HasOne<Order>()
            .WithMany()
            .HasForeignKey(change => change.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
