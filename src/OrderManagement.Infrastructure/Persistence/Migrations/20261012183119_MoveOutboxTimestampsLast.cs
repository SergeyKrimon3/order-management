using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveOutboxTimestampsLast : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE outbox_messages_reordered (
                    id uuid NOT NULL,
                    event_type character varying(40) NOT NULL,
                    payload text NOT NULL,
                    correlation_id uuid NOT NULL,
                    traceparent character varying(128) NULL,
                    created_at timestamp without time zone NOT NULL,
                    published_at timestamp without time zone NULL,
                    CONSTRAINT "PK_outbox_messages_reordered" PRIMARY KEY (id)
                );

                INSERT INTO outbox_messages_reordered (id, event_type, payload, correlation_id, traceparent, created_at, published_at)
                SELECT id, event_type, payload, correlation_id, traceparent, created_at, published_at
                FROM outbox_messages;

                DROP TABLE outbox_messages;
                ALTER TABLE outbox_messages_reordered RENAME TO outbox_messages;
                ALTER TABLE outbox_messages RENAME CONSTRAINT "PK_outbox_messages_reordered" TO "PK_outbox_messages";
                CREATE INDEX ix_outbox_messages_pending ON outbox_messages (created_at) WHERE published_at IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE outbox_messages_reordered (
                    id uuid NOT NULL,
                    event_type character varying(40) NOT NULL,
                    payload text NOT NULL,
                    correlation_id uuid NOT NULL,
                    created_at timestamp without time zone NOT NULL,
                    published_at timestamp without time zone NULL,
                    traceparent character varying(128) NULL,
                    CONSTRAINT "PK_outbox_messages_reordered" PRIMARY KEY (id)
                );

                INSERT INTO outbox_messages_reordered (id, event_type, payload, correlation_id, created_at, published_at, traceparent)
                SELECT id, event_type, payload, correlation_id, created_at, published_at, traceparent
                FROM outbox_messages;

                DROP TABLE outbox_messages;
                ALTER TABLE outbox_messages_reordered RENAME TO outbox_messages;
                ALTER TABLE outbox_messages RENAME CONSTRAINT "PK_outbox_messages_reordered" TO "PK_outbox_messages";
                CREATE INDEX ix_outbox_messages_pending ON outbox_messages (created_at) WHERE published_at IS NULL;
                """);
        }
    }
}
