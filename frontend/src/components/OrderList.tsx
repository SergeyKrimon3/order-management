import { useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import { formatAmount, formatDate, statusLabel } from "../format";
import { t } from "../i18n";
import type { Order, OrderStatus } from "../types/order";
import { Icon, iconPaths } from "./Icon";
import { WorkerDots } from "./WorkerDots";

interface OrderListProps {
    orders: Order[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

type SortKey = "customer" | "product" | "amount" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

interface SortState {
    key: SortKey;
    direction: SortDirection;
}

const columns: readonly { key: SortKey; label: "customer" | "product" | "amount" | "status" | "createdAt" }[] = [
    { key: "customer", label: "customer" },
    { key: "product", label: "product" },
    { key: "amount", label: "amount" },
    { key: "status", label: "status" },
    { key: "createdAt", label: "createdAt" },
];

const statusRank: Record<OrderStatus, number> = {
    pending: 0,
    processing: 1,
    completed: 2,
};

const statuses: readonly OrderStatus[] = ["pending", "processing", "completed"];

function centsDigits(value: string): string {
    return value.replace(/\D/g, "").replace(/^0+/, "");
}

function formatCents(digits: string): string {
    if (digits.length === 0) {
        return "";
    }

    const padded = digits.padStart(3, "0");
    const whole = padded.slice(0, -2);
    const fraction = padded.slice(-2);
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${grouped},${fraction}`;
}

function onAmountKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
        event.preventDefault();
    }
}

function isOrderStatus(value: string): value is OrderStatus {
    return value === "pending" || value === "processing" || value === "completed";
}

function compareOrders(left: Order, right: Order, key: SortKey): number {
    switch (key) {
        case "customer":
            return left.customer.localeCompare(right.customer, "pt-BR", { sensitivity: "base" });
        case "product":
            return left.product.localeCompare(right.product, "pt-BR", { sensitivity: "base" });
        case "amount":
            return left.amount - right.amount;
        case "status":
            return statusRank[left.status] - statusRank[right.status];
        case "createdAt":
            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }
}

function fold(value: string): string {
    return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function includesText(value: string, query: string): boolean {
    const normalized = fold(query.trim());
    if (normalized.length === 0) {
        return true;
    }

    return fold(value).includes(normalized);
}

function saoPauloDay(value: string): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date(value));
}

function matchesDay(createdAt: string, day: string): boolean {
    if (day.length === 0) {
        return true;
    }

    return saoPauloDay(createdAt) === day;
}

function openCalendar(event: ReactMouseEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const rect = input.getBoundingClientRect();
    if (event.clientX > rect.right - 32) {
        return;
    }

    if (typeof input.showPicker !== "function") {
        return;
    }

    try {
        input.showPicker();
    } catch {
        return;
    }
}

function matchesAmount(amount: number, digits: string): boolean {
    if (digits.length === 0) {
        return true;
    }

    return Math.round(amount * 100) === Number(digits);
}

function matchesFilters(order: Order, filters: Record<SortKey, string>): boolean {
    if (!includesText(order.customer, filters.customer)) {
        return false;
    }

    if (!includesText(order.product, filters.product)) {
        return false;
    }

    if (!matchesAmount(order.amount, filters.amount)) {
        return false;
    }

    if (filters.status.length > 0 && order.status !== filters.status) {
        return false;
    }

    return matchesDay(order.createdAt, filters.createdAt);
}

function ClearFilter({ onClear }: { onClear: () => void }) {
    return (
        <button type="button" className="filter-clear" aria-label={t("clearFilter")} onClick={onClear}>
            <Icon paths={iconPaths.closeCircle} />
        </button>
    );
}

function SortArrow({ active, direction }: { active: boolean; direction: SortDirection }) {
    const pointsUp = !active || direction === "asc";
    return (
        <svg className={active ? "sort-arrow" : "sort-arrow is-idle"} viewBox="0 0 12 12" aria-hidden="true">
            {pointsUp ? (
                <path d="M6 2.2V9.8M3.2 5.2 6 2.2l2.8 3" />
            ) : (
                <path d="M6 9.8V2.2M3.2 6.8 6 9.8l2.8-3" />
            )}
        </svg>
    );
}

export function OrderList({ orders, selectedId, onSelect }: OrderListProps) {
    const [sort, setSort] = useState<SortState | null>(null);
    const [filters, setFilters] = useState<Record<SortKey, string>>({
        customer: "",
        product: "",
        amount: "",
        status: "",
        createdAt: "",
    });

    if (orders.length === 0) {
        return <p className="empty">{t("empty")}</p>;
    }

    const filtered = orders.filter((order) => matchesFilters(order, filters));
    const visible = sort === null
        ? [...filtered]
        : filtered
            .map((order, index) => ({ order, index }))
            .sort((left, right) => {
                const compared = compareOrders(left.order, right.order, sort.key);
                const directed = sort.direction === "asc" ? compared : -compared;
                return directed === 0 ? left.index - right.index : directed;
            })
            .map((item) => item.order);

    function setFilter(key: SortKey, value: string) {
        setFilters((current) => ({ ...current, [key]: value }));
    }

    function toggleSort(key: SortKey) {
        setSort((current) => {
            if (current?.key !== key) {
                return { key, direction: "asc" };
            }
            return { key, direction: current.direction === "asc" ? "desc" : "asc" };
        });
    }

    return (
        <div className={visible.length === 0 ? "order-list is-empty" : "order-list"}>
            <div className="table-wrap">
                <table className="order-table">
                    <thead>
                        <tr className="sort-row">
                            {columns.map((column) => {
                                const active = sort?.key === column.key;
                                const direction = sort?.direction ?? "asc";
                                return (
                                    <th
                                        key={column.key}
                                        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
                                    >
                                        <button
                                            type="button"
                                            className={active ? "sort-header is-active" : "sort-header"}
                                            aria-label={`${t("sortBy")} ${t(column.label)}`}
                                            onClick={() => toggleSort(column.key)}
                                        >
                                            <span>{t(column.label)}</span>
                                            <SortArrow active={active} direction={direction} />
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                        <tr className="order-filter-row">
                            {columns.map((column) => (
                                <th key={column.key}>
                                    <span className="filter-caption">{t(column.label)}</span>
                                    {column.key === "status" ? (
                                        <div className="filter-field">
                                            <select
                                                className="order-search order-status"
                                                value={filters.status}
                                                aria-label={`${t("searchOrders")} ${t("status")}`}
                                                onChange={(event) => {
                                                    const value = event.target.value;
                                                    setFilter("status", isOrderStatus(value) ? value : "");
                                                }}
                                            >
                                                <option value="">{t("selectOption")}</option>
                                                {statuses.map((status) => (
                                                    <option key={status} value={status}>{statusLabel(status)}</option>
                                                ))}
                                            </select>
                                            {filters.status.length > 0 ? (
                                                <ClearFilter onClear={() => setFilter("status", "")} />
                                            ) : (
                                                <span className="filter-chevron" aria-hidden="true" />
                                            )}
                                        </div>
                                    ) : column.key === "amount" ? (
                                        <div className="filter-field">
                                            <span className="filter-prefix" aria-hidden="true">R$</span>
                                            <input
                                                className={filters.amount.length > 0 ? "order-search has-prefix has-clear" : "order-search has-prefix"}
                                                value={formatCents(filters.amount)}
                                                placeholder={t("searchOrders")}
                                                aria-label={`${t("searchOrders")} ${t("amount")}`}
                                                inputMode="numeric"
                                                autoComplete="off"
                                                onKeyDown={onAmountKeyDown}
                                                onChange={(event) => setFilter("amount", centsDigits(event.target.value))}
                                            />
                                            {filters.amount.length > 0 ? <ClearFilter onClear={() => setFilter("amount", "")} /> : null}
                                        </div>
                                    ) : column.key === "createdAt" ? (
                                        <div className="filter-field">
                                            <input
                                                className={filters.createdAt.length > 0 ? "order-search order-date has-clear" : "order-search order-date"}
                                                type="date"
                                                value={filters.createdAt}
                                                aria-label={`${t("searchOrders")} ${t("createdAt")}`}
                                                onClick={openCalendar}
                                                onChange={(event) => setFilter("createdAt", event.target.value)}
                                            />
                                            {filters.createdAt.length > 0 ? <ClearFilter onClear={() => setFilter("createdAt", "")} /> : null}
                                        </div>
                                    ) : (
                                        <div className="filter-field">
                                            <input
                                                className={filters[column.key].length > 0 ? "order-search has-clear" : "order-search"}
                                                type="search"
                                                value={filters[column.key]}
                                                placeholder={t("searchOrders")}
                                                aria-label={`${t("searchOrders")} ${t(column.label)}`}
                                                onChange={(event) => setFilter(column.key, event.target.value)}
                                            />
                                            {filters[column.key].length > 0 ? <ClearFilter onClear={() => setFilter(column.key, "")} /> : null}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((order) => (
                            <tr
                                key={order.id}
                                className={order.id === selectedId ? "selected" : undefined}
                                onClick={() => onSelect(order.id)}
                            >
                                <td>{order.customer}</td>
                                <td>{order.product}</td>
                                <td>{formatAmount(order.amount)}</td>
                                <td>
                                    <span className="order-lead">
                                        <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                        <WorkerDots status={order.status} />
                                    </span>
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {visible.length === 0 ? <p className="empty order-no-results">{t("noResults")}</p> : null}
            <ul className="cards">
                {visible.map((order) => (
                    <li key={order.id}>
                        <button
                            type="button"
                            className={order.id === selectedId ? "card selected" : "card"}
                            onClick={() => onSelect(order.id)}
                        >
                            <strong>{order.customer}</strong>
                            <span>{order.product}</span>
                            <span>{formatAmount(order.amount)}</span>
                            <span className="order-lead">
                                <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                <WorkerDots status={order.status} />
                            </span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
