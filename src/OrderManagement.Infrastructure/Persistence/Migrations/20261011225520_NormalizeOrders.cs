using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders DROP CONSTRAINT ck_orders_status;

                UPDATE orders
                SET status = lower(status);

                UPDATE orders SET id = '1f457889-3e99-4075-8802-ffec7e55026c' WHERE id = '01900000-0000-7000-8000-000000000001';
                UPDATE orders SET id = 'e6c47824-bfa2-480c-af3d-62492c51c15f' WHERE id = '01900000-0000-7000-8000-000000000002';
                UPDATE orders SET id = 'd9edd0d8-e4b3-44e9-b9a5-c96078400479' WHERE id = '01900000-0000-7000-8000-000000000003';
                UPDATE orders SET id = '8aaf135c-09c9-4672-9de5-dae6e6755ce9' WHERE id = '01900000-0000-7000-8000-000000000004';
                UPDATE orders SET id = '3c980c77-ddcd-46cb-8378-d56ab404ad8f' WHERE id = '01900000-0000-7000-8000-000000000005';
                UPDATE orders SET id = '8e6a3d05-475d-4f18-807f-5d90e072d375' WHERE id = '01900000-0000-7000-8000-000000000006';

                ALTER TABLE orders
                    ALTER COLUMN created_at TYPE timestamp with time zone
                    USING created_at AT TIME ZONE 'America/Sao_Paulo';

                ALTER TABLE orders
                    ALTER COLUMN updated_at TYPE timestamp with time zone
                    USING updated_at AT TIME ZONE 'America/Sao_Paulo';

                ALTER TABLE orders
                    ADD CONSTRAINT ck_orders_status CHECK (status IN ('pending', 'processing', 'finished'));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders DROP CONSTRAINT ck_orders_status;

                ALTER TABLE orders
                    ALTER COLUMN created_at TYPE timestamp without time zone
                    USING created_at AT TIME ZONE 'America/Sao_Paulo';

                ALTER TABLE orders
                    ALTER COLUMN updated_at TYPE timestamp without time zone
                    USING updated_at AT TIME ZONE 'America/Sao_Paulo';

                UPDATE orders SET id = '01900000-0000-7000-8000-000000000001' WHERE id = '1f457889-3e99-4075-8802-ffec7e55026c';
                UPDATE orders SET id = '01900000-0000-7000-8000-000000000002' WHERE id = 'e6c47824-bfa2-480c-af3d-62492c51c15f';
                UPDATE orders SET id = '01900000-0000-7000-8000-000000000003' WHERE id = 'd9edd0d8-e4b3-44e9-b9a5-c96078400479';
                UPDATE orders SET id = '01900000-0000-7000-8000-000000000004' WHERE id = '8aaf135c-09c9-4672-9de5-dae6e6755ce9';
                UPDATE orders SET id = '01900000-0000-7000-8000-000000000005' WHERE id = '3c980c77-ddcd-46cb-8378-d56ab404ad8f';
                UPDATE orders SET id = '01900000-0000-7000-8000-000000000006' WHERE id = '8e6a3d05-475d-4f18-807f-5d90e072d375';

                UPDATE orders
                SET status = CASE status
                    WHEN 'pending' THEN 'Pending'
                    WHEN 'processing' THEN 'Processing'
                    WHEN 'finished' THEN 'Finished'
                    ELSE status
                END;

                ALTER TABLE orders
                    ADD CONSTRAINT ck_orders_status CHECK (status IN ('Pending', 'Processing', 'Finished'));
                """);
        }
    }
}
