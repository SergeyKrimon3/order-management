import { useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { formatAmount, formatDayAndTime, statusLabel, stepCaption } from "../format";
import { t } from "../i18n";
import type { Order, OrderStatus } from "../types/order";
import { FilterCalendar } from "./FilterCalendar";
import { FilterSelect } from "./FilterSelect";
import { Icon, iconPaths } from "./Icon";
import { WorkerDots } from "./WorkerDots";

interface OrderListProps {
    orders: Order[];
    onSelect: (id: string) => void;
}

type SortKey = "customer" | "product" | "amount" | "status" | "createdAt";
type SortDirection = "asc" | "desc";

interface SortState {
    key: SortKey;
    direction: SortDirection;
}

const columns: readonly { key: SortKey; label: "customer" | "product" | "amount" | "status" | "createdAt" }[] = [
    { key: "product", label: "product" },
    { key: "customer", label: "customer" },
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

function matchesRange(createdAt: string, value: string): boolean {
    if (value.length === 0) {
        return true;
    }

    const [start = "", end = ""] = value.split("|");
    if (start.length === 0 || end.length === 0) {
        return true;
    }

    const day = saoPauloDay(createdAt);
    return day >= start && day <= end;
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

    return matchesRange(order.createdAt, filters.createdAt);
}

function ViewOrder({ id }: { id: string }) {
    return (
        <a
            className="view-order"
            href={`/orders/${id}`}
            target="_blank"
            rel="noreferrer"
            aria-label={t("viewOrder")}
            onClick={(event) => event.stopPropagation()}
        >
            <Icon paths={iconPaths.eye} />
            <span className="view-order-tip" aria-hidden="true">{t("viewOrder")}</span>
        </a>
    );
}

function ProductCell({ order }: { order: Order }) {
    return (
        <span className="product-cell">
            {order.image ? (
                <img className="product-thumb" src={order.image} alt="" />
            ) : (
                <span className="product-thumb is-fallback">{order.product.slice(0, 1)}</span>
            )}
            <span>{order.product}</span>
        </span>
    );
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

export function OrderList({ orders, onSelect }: OrderListProps) {
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
                            <th className="actions-col">{t("actions")}</th>
                        </tr>
                        <tr className="order-filter-row">
                            {columns.map((column) => (
                                <th key={column.key}>
                                    <span className="filter-caption">{t(column.label)}</span>
                                    {column.key === "status" ? (
                                        <FilterSelect
                                            value={filters.status}
                                            ariaLabel={`${t("searchOrders")} ${t("status")}`}
                                            options={statuses.map((status) => ({ value: status, label: statusLabel(status) }))}
                                            onChange={(value) => setFilter("status", value)}
                                            onClear={() => setFilter("status", "")}
                                        />
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
                                        <FilterCalendar
                                            start={filters.createdAt.split("|")[0] ?? ""}
                                            end={filters.createdAt.split("|")[1] ?? ""}
                                            ariaLabel={`${t("searchOrders")} ${t("createdAt")}`}
                                            onChange={(start, end) => setFilter("createdAt", `${start}|${end}`)}
                                            onClear={() => setFilter("createdAt", "")}
                                        />
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
                            <th className="actions-filter" />
                        </tr>
                    </thead>
                    <tbody>
                        {visible.map((order) => (
                            <tr key={order.id} onClick={() => onSelect(order.id)}>
                                <td><ProductCell order={order} /></td>
                                <td>{order.customer}</td>
                                <td>{formatAmount(order.amount)}</td>
                                <td>
                                    <span className="order-lead is-stacked">
                                        <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                        <span className="step-caption">{stepCaption(order.status)}</span>
                                        <WorkerDots status={order.status} />
                                    </span>
                                </td>
                                <td>{formatDayAndTime(order.createdAt)}</td>
                                <td className="actions-col">
                                    <ViewOrder id={order.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {visible.length === 0 ? <p className="empty order-no-results">{t("noResults")}</p> : null}
            <ul className="cards">
                {visible.map((order) => (
                    <li key={order.id} className="card-line">
                        <button
                            type="button"
                            className="card"
                            onClick={() => onSelect(order.id)}
                        >
                            <ProductCell order={order} />
                            <span>{order.customer}</span>
                            <span>{formatAmount(order.amount)}</span>
                            <span className="order-lead is-stacked">
                                <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                <span className="step-caption">{stepCaption(order.status)}</span>
                                <WorkerDots status={order.status} />
                            </span>
                        </button>
                        <ViewOrder id={order.id} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
