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
            .HasColumnName("id");

        builder.Property(message => message.EventType)
            .HasColumnName("event_type")
            .HasMaxLength(40)
            .IsRequired();

        builder.Property(message => message.Payload)
            .HasColumnName("payload")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(message => message.CorrelationId)
            .HasColumnName("correlation_id");

        builder.Property(message => message.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.Property(message => message.PublishedAt)
            .HasColumnName("published_at")
            .HasColumnType("timestamp without time zone");

        builder.HasIndex(message => message.CreatedAt)
            .HasDatabaseName("ix_outbox_messages_pending")
            .HasFilter("published_at IS NULL");
    }
}
