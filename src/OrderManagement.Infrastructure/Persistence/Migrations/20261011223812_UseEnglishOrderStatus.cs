using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseEnglishOrderStatus : Migration
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
                    created_at timestamp with time zone NOT NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_orders_reordered" PRIMARY KEY (id),
                    CONSTRAINT ck_orders_amount_reordered CHECK (amount > 0),
                    CONSTRAINT ck_orders_status_reordered CHECK (status IN ('Pending', 'Processing', 'Finished'))
                );

                INSERT INTO orders_reordered (id, customer, product, amount, status, image, created_at, updated_at)
                SELECT
                    id,
                    customer,
                    product,
                    amount,
                    CASE status
                        WHEN 'Pendente' THEN 'Pending'
                        WHEN 'Processando' THEN 'Processing'
                        WHEN 'Finalizado' THEN 'Finished'
                        ELSE status
                    END,
                    image,
                    created_at,
                    updated_at
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
                    created_at timestamp with time zone NOT NULL,
                    image text NULL,
                    updated_at timestamp with time zone NOT NULL,
                    CONSTRAINT "PK_orders_reordered" PRIMARY KEY (id),
                    CONSTRAINT ck_orders_amount_reordered CHECK (amount > 0),
                    CONSTRAINT ck_orders_status_reordered CHECK (status IN ('Pendente', 'Processando', 'Finalizado'))
                );

                INSERT INTO orders_reordered (id, customer, product, amount, status, created_at, image, updated_at)
                SELECT
                    id,
                    customer,
                    product,
                    amount,
                    CASE status
                        WHEN 'Pending' THEN 'Pendente'
                        WHEN 'Processing' THEN 'Processando'
                        WHEN 'Finished' THEN 'Finalizado'
                        ELSE status
                    END,
                    created_at,
                    image,
                    updated_at
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
