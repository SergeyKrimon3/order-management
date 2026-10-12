using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Domain.Favorites;
using OrderManagement.Domain.Orders;

namespace OrderManagement.Infrastructure.Persistence;

public sealed class FavoriteConfiguration : IEntityTypeConfiguration<Favorite>
{
    public void Configure(EntityTypeBuilder<Favorite> builder)
    {
        builder.ToTable("favorites");

        builder.HasKey(favorite => favorite.Id);

        builder.Property(favorite => favorite.Id)
            .HasColumnName("id")
            .UseIdentityByDefaultColumn();

        builder.Property(favorite => favorite.OrderId)
            .HasColumnName("order_id")
            .IsRequired();

        builder.Property(favorite => favorite.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.HasIndex(favorite => favorite.OrderId)
            .IsUnique();

        builder.HasOne<Order>()
            .WithMany()
            .HasForeignKey(favorite => favorite.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
