using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderManagement.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DropOrderTimestampOffset : Migration
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

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("1f457889-3e99-4075-8802-ffec7e55026c"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("3c980c77-ddcd-46cb-8378-d56ab404ad8f"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8aaf135c-09c9-4672-9de5-dae6e6755ce9"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8e6a3d05-475d-4f18-807f-5d90e072d375"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("d9edd0d8-e4b3-44e9-b9a5-c96078400479"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("e6c47824-bfa2-480c-af3d-62492c51c15f"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified), new DateTime(2026, 10, 11, 20, 4, 41, 0, DateTimeKind.Unspecified) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "updated_at",
                table: "orders",
                type: "timestamp(0) with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "created_at",
                table: "orders",
                type: "timestamp(0) with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("1f457889-3e99-4075-8802-ffec7e55026c"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("3c980c77-ddcd-46cb-8378-d56ab404ad8f"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8aaf135c-09c9-4672-9de5-dae6e6755ce9"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("8e6a3d05-475d-4f18-807f-5d90e072d375"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("d9edd0d8-e4b3-44e9-b9a5-c96078400479"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });

            migrationBuilder.UpdateData(
                table: "orders",
                keyColumn: "id",
                keyValue: new Guid("e6c47824-bfa2-480c-af3d-62492c51c15f"),
                columns: new[] { "created_at", "updated_at" },
                values: new object[] { new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), new DateTimeOffset(new DateTime(2026, 10, 11, 23, 4, 41, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)) });
        }
    }
}
