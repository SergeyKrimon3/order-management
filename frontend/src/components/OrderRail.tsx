import { findProductByLabel, type CatalogProduct } from "../catalog";
import { formatAmount, formatDayAndTime, statusLabel } from "../format";
import { t } from "../i18n";
import type { Order } from "../types/order";
import { WorkerDots } from "./WorkerDots";

interface OrderRailProps {
    orders: readonly Order[];
    onSelect: (id: string) => void;
}

function thumbFor(order: Order): CatalogProduct | null {
    return findProductByLabel(order.product, (product) => t(product.nameKey));
}

export function OrderRail({ orders, onSelect }: OrderRailProps) {
    if (orders.length === 0) {
        return <p className="empty">{t("empty")}</p>;
    }

    return (
        <ul className="rail-list">
            {orders.map((order) => {
                const product = thumbFor(order);
                const image = order.image ?? product?.image;
                return (
                    <li key={order.id}>
                        <button
                            type="button"
                            className="order-row"
                            onClick={() => onSelect(order.id)}
                        >
                            {image ? (
                                <img src={image} alt="" />
                            ) : (
                                <span className="thumb-fallback">{order.product.slice(0, 1)}</span>
                            )}
                            <span>
                                {order.customer}
                                <small>
                                    {order.product} · {formatAmount(order.amount)}
                                </small>
                                <small>
                                    {formatDayAndTime(order.createdAt)}
                                </small>
                            </span>
                            <span className="order-lead">
                                <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                <WorkerDots status={order.status} />
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}
