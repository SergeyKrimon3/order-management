using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderManagement.Infrastructure.Messaging;

namespace OrderManagement.Infrastructure.Persistence;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("outbox_messages");

        builder.HasKey(message => message.Id);

        builder.Property(message => message.Id)
            .HasColumnName("id")
            .HasColumnOrder(0);

        builder.Property(message => message.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(40)
            .IsRequired()
            .HasColumnOrder(1);

        builder.Property(message => message.Payload)
            .HasColumnName("payload")
            .HasColumnType("text")
            .IsRequired()
            .HasColumnOrder(2);

        builder.Property(message => message.CorrelationId)
            .HasColumnName("correlation_id")
            .HasColumnOrder(3);

        builder.Property(message => message.TraceParent)
            .HasColumnName("traceparent")
            .HasMaxLength(128)
            .HasColumnOrder(4);

        builder.Property(message => message.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired()
            .HasColumnOrder(5);

        builder.Property(message => message.PublishedAt)
            .HasColumnName("published_at")
            .HasColumnType("timestamp without time zone")
            .HasColumnOrder(6);

        builder.HasIndex(message => message.CreatedAt)
            .HasDatabaseName("ix_outbox_messages_pending")
            .HasFilter("published_at IS NULL");
    }
}
