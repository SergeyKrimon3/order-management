using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("UPDATE orders SET updated_at = created_at;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "updated_at",
                table: "orders",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000001"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 5, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000002"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 4, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000003"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 3, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000004"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 2, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000005"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 1, 0, 0, DateTimeKind.Utc));

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000006"),
                column: "updated_at",
                value: new DateTime(2026, 10, 11, 18, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "orders");
        }
    }
}
