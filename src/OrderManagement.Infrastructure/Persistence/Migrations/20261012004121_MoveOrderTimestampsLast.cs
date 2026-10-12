using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MoveOrderTimestampsLast : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE orders_reordered (
                    id uuid NOT NULL,
                    customer character varying(200) NOT NULL,
                    product character varying(200) NOT NULL,
                    amount numeric(18,2) NOT NULL,
                    status character varying(20) NOT NULL,
                    image text NULL,
                    repeat_of_id uuid NULL,
                    created_at timestamp without time zone NOT NULL,
                    updated_at timestamp without time zone NOT NULL,
                    CONSTRAINT "PK_orders_reordered" PRIMARY KEY (id),
                    CONSTRAINT ck_orders_amount_reordered CHECK (amount > 0),
                    CONSTRAINT ck_orders_status_reordered CHECK (status IN ('pending', 'processing', 'completed'))
                );

                INSERT INTO orders_reordered (id, customer, product, amount, status, image, repeat_of_id, created_at, updated_at)
                SELECT id, customer, product, amount, status, image, repeat_of_id, created_at, updated_at
                FROM orders;

                DROP TABLE orders;
                ALTER TABLE orders_reordered RENAME TO orders;
                ALTER TABLE orders RENAME CONSTRAINT "PK_orders_reordered" TO "PK_orders";
                ALTER TABLE orders RENAME CONSTRAINT ck_orders_amount_reordered TO ck_orders_amount;
                ALTER TABLE orders RENAME CONSTRAINT ck_orders_status_reordered TO ck_orders_status;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TABLE orders_reordered (
                    id uuid NOT NULL,
                    customer character varying(200) NOT NULL,
                    product character varying(200) NOT NULL,
                    amount numeric(18,2) NOT NULL,
                    status character varying(20) NOT NULL,
                    image text NULL,
                    created_at timestamp without time zone NOT NULL,
                    updated_at timestamp without time zone NOT NULL,
                    repeat_of_id uuid NULL,
                    CONSTRAINT "PK_orders_reordered" PRIMARY KEY (id),
                    CONSTRAINT ck_orders_amount_reordered CHECK (amount > 0),
                    CONSTRAINT ck_orders_status_reordered CHECK (status IN ('pending', 'processing', 'completed'))
                );

                INSERT INTO orders_reordered (id, customer, product, amount, status, image, created_at, updated_at, repeat_of_id)
                SELECT id, customer, product, amount, status, image, created_at, updated_at, repeat_of_id
                FROM orders;

                DROP TABLE orders;
                ALTER TABLE orders_reordered RENAME TO orders;
                ALTER TABLE orders RENAME CONSTRAINT "PK_orders_reordered" TO "PK_orders";
                ALTER TABLE orders RENAME CONSTRAINT ck_orders_amount_reordered TO ck_orders_amount;
                ALTER TABLE orders RENAME CONSTRAINT ck_orders_status_reordered TO ck_orders_status;
                """);
        }
    }
}
