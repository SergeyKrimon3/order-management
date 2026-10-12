import { formatAmount, formatDate, statusLabel } from "../format";
import { t } from "../i18n";
import type { Order } from "../types/order";
import { WorkerDots } from "./WorkerDots";

interface OrderListProps {
    orders: Order[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function OrderList({ orders, selectedId, onSelect }: OrderListProps) {
    if (orders.length === 0) {
        return <p className="empty">{t("empty")}</p>;
    }

    return (
        <>
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>{t("customer")}</th>
                            <th>{t("product")}</th>
                            <th>{t("amount")}</th>
                            <th>{t("status")}</th>
                            <th>{t("createdAt")}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
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
            <ul className="cards">
                {orders.map((order) => (
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
        </>
    );
}
