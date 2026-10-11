using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameOrderColumnsToEnglish : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_orders_valor",
                table: "orders");

            migrationBuilder.RenameColumn(
                name: "valor",
                table: "orders",
                newName: "amount");

            migrationBuilder.RenameColumn(
                name: "produto",
                table: "orders",
                newName: "product");

            migrationBuilder.RenameColumn(
                name: "data_criacao",
                table: "orders",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "cliente",
                table: "orders",
                newName: "customer");

            migrationBuilder.AddCheckConstraint(
                name: "ck_orders_amount",
                table: "orders",
                sql: "amount > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_orders_amount",
                table: "orders");

            migrationBuilder.RenameColumn(
                name: "product",
                table: "orders",
                newName: "produto");

            migrationBuilder.RenameColumn(
                name: "customer",
                table: "orders",
                newName: "cliente");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "orders",
                newName: "data_criacao");

            migrationBuilder.RenameColumn(
                name: "amount",
                table: "orders",
                newName: "valor");

            migrationBuilder.AddCheckConstraint(
                name: "ck_orders_valor",
                table: "orders",
                sql: "valor > 0");
        }
    }
}
