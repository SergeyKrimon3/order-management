using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UseBrasiliaLocalTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                    ALTER COLUMN created_at TYPE timestamp without time zone
                    USING created_at AT TIME ZONE 'America/Sao_Paulo';

                ALTER TABLE orders
                    ALTER COLUMN updated_at TYPE timestamp without time zone
                    USING updated_at AT TIME ZONE 'America/Sao_Paulo';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE orders
                    ALTER COLUMN created_at TYPE timestamp with time zone
                    USING created_at AT TIME ZONE 'America/Sao_Paulo';

                ALTER TABLE orders
                    ALTER COLUMN updated_at TYPE timestamp with time zone
                    USING updated_at AT TIME ZONE 'America/Sao_Paulo';
                """);
        }
    }
}
