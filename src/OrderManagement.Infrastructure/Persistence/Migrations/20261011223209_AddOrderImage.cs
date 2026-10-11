using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "image",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.InsertData(
                table: "orders",
                columns: new[] { "id", "amount", "created_at", "customer", "image", "product", "status" },
                values: new object[,]
                {
                    { new Guid("01900000-0000-7000-8000-000000000001"), 59m, new DateTime(2026, 10, 11, 18, 5, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", "Sacola", "Pendente" },
                    { new Guid("01900000-0000-7000-8000-000000000002"), 189m, new DateTime(2026, 10, 11, 18, 4, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80", "Fone", "Pendente" },
                    { new Guid("01900000-0000-7000-8000-000000000003"), 18m, new DateTime(2026, 10, 11, 18, 3, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", "Café", "Pendente" },
                    { new Guid("01900000-0000-7000-8000-000000000004"), 25m, new DateTime(2026, 10, 11, 18, 2, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80", "Caderno", "Pendente" },
                    { new Guid("01900000-0000-7000-8000-000000000005"), 14m, new DateTime(2026, 10, 11, 18, 1, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80", "Bloco de notas", "Pendente" },
                    { new Guid("01900000-0000-7000-8000-000000000006"), 9m, new DateTime(2026, 10, 11, 18, 0, 0, 0, DateTimeKind.Utc), "Vitrine", "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=80", "Marcador", "Pendente" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000001"));

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000002"));

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000003"));

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000004"));

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000005"));

            migrationBuilder.DeleteData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("01900000-0000-7000-8000-000000000006"));

            migrationBuilder.DropColumn(
                name: "image",
                table: "orders");
        }
    }
}
