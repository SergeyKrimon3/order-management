using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CompleteExistingOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE orders
                SET status = 'completed',
                    updated_at = CURRENT_TIMESTAMP
                WHERE status <> 'completed';
                """);

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("1f457889-3e99-4075-8802-ffec7e55026c"),
                column: "status",
                value: "completed");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("3c980c77-ddcd-46cb-8378-d56ab404ad8f"),
                column: "status",
                value: "completed");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8aaf135c-09c9-4672-9de5-dae6e6755ce9"),
                column: "status",
                value: "completed");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8e6a3d05-475d-4f18-807f-5d90e072d375"),
                column: "status",
                value: "completed");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("d9edd0d8-e4b3-44e9-b9a5-c96078400479"),
                column: "status",
                value: "completed");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("e6c47824-bfa2-480c-af3d-62492c51c15f"),
                column: "status",
                value: "completed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("1f457889-3e99-4075-8802-ffec7e55026c"),
                column: "status",
                value: "pending");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("3c980c77-ddcd-46cb-8378-d56ab404ad8f"),
                column: "status",
                value: "pending");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8aaf135c-09c9-4672-9de5-dae6e6755ce9"),
                column: "status",
                value: "pending");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8e6a3d05-475d-4f18-807f-5d90e072d375"),
                column: "status",
                value: "pending");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("d9edd0d8-e4b3-44e9-b9a5-c96078400479"),
                column: "status",
                value: "pending");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("e6c47824-bfa2-480c-af3d-62492c51c15f"),
                column: "status",
                value: "pending");
        }
    }
}
