using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedShowcaseOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO orders (id, customer, product, amount, status, image, repeat_of_id, created_at, updated_at)
                VALUES
                    ('1f457889-3e99-4075-8802-ffec7e55026c', 'Vitrine', 'Sacola', 59.00, 'completed', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41'),
                    ('e6c47824-bfa2-480c-af3d-62492c51c15f', 'Vitrine', 'Fone', 189.00, 'completed', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41'),
                    ('d9edd0d8-e4b3-44e9-b9a5-c96078400479', 'Vitrine', 'Café', 18.00, 'completed', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41'),
                    ('8aaf135c-09c9-4672-9de5-dae6e6755ce9', 'Vitrine', 'Caderno', 25.00, 'completed', 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41'),
                    ('3c980c77-ddcd-46cb-8378-d56ab404ad8f', 'Vitrine', 'Bloco de notas', 14.00, 'completed', 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41'),
                    ('8e6a3d05-475d-4f18-807f-5d90e072d375', 'Vitrine', 'Marcador', 9.00, 'completed', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=80', NULL, TIMESTAMP '2026-10-11 20:04:41', TIMESTAMP '2026-10-11 20:04:41')
                ON CONFLICT (id) DO NOTHING;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM orders
                WHERE id IN (
                    '1f457889-3e99-4075-8802-ffec7e55026c',
                    'e6c47824-bfa2-480c-af3d-62492c51c15f',
                    'd9edd0d8-e4b3-44e9-b9a5-c96078400479',
                    '8aaf135c-09c9-4672-9de5-dae6e6755ce9',
                    '3c980c77-ddcd-46cb-8378-d56ab404ad8f',
                    '8e6a3d05-475d-4f18-807f-5d90e072d375'
                );
                """);
        }
    }
}
