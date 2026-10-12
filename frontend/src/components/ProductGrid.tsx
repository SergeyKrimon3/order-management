import { useState } from "react";
import { formatAmount, formatDay } from "../format";
import { t } from "../i18n";
import type { Order } from "../types/order";
import { EmptyFavorites } from "./EmptyFavorites";
import { Icon, iconPaths } from "./Icon";

interface ProductGridProps {
    orders: readonly Order[];
    favoriteIds: readonly string[];
    onToggleFavorite: (id: string) => void;
    onOpen: (id: string) => void;
    onReorder: (order: Order) => void;
    onCreateOrder?: () => void;
}

export function ProductGrid({
    orders,
    favoriteIds,
    onToggleFavorite,
    onOpen,
    onReorder,
    onCreateOrder,
}: ProductGridProps) {
    const [pulsingId, setPulsingId] = useState<string | null>(null);

    if (orders.length === 0 && !onCreateOrder) {
        return <EmptyFavorites />;
    }

    return (
        <ul className="photo-grid">
            {onCreateOrder ? (
                <li className="create-order-item">
                    <button type="button" className="create-order" onClick={onCreateOrder}>
                        <span className="create-order-mark" aria-hidden="true" />
                        {t("createOrder")}
                    </button>
                </li>
            ) : null}
            {orders.map((order) => {
                const favorite = favoriteIds.includes(order.id);
                const heartClass = favorite
                    ? pulsingId === order.id
                        ? "heart-float is-on is-pulse"
                        : "heart-float is-on"
                    : "heart-float";
                return (
                    <li key={order.id} className="photo-card">
                        <div className="photo-frame">
                            {order.image ? (
                                <img src={order.image} alt={order.product} />
                            ) : (
                                <span className="photo-fallback">{order.product.slice(0, 1)}</span>
                            )}
                            <button
                                type="button"
                                className="photo-open"
                                aria-label={order.product}
                                onClick={() => onOpen(order.id)}
                            />
                            <button
                                type="button"
                                className={heartClass}
                                aria-label={favorite ? t("favoriteRemove") : t("favoriteAdd")}
                                aria-pressed={favorite}
                                onAnimationEnd={() => {
                                    if (pulsingId === order.id) {
                                        setPulsingId(null);
                                    }
                                }}
                                onClick={() => {
                                    if (!favorite) {
                                        setPulsingId(order.id);
                                    }
                                    onToggleFavorite(order.id);
                                }}
                            >
                                <Icon paths={iconPaths.heart} filled={favorite} />
                            </button>
                            <div className="shade" />
                            <div className="cap">
                                <span className="cap-copy">
                                    <strong>{order.product}</strong>
                                    <small>
                                        {t("customer")}: {order.customer}
                                    </small>
                                    <small>{order.id}</small>
                                </span>
                            </div>
                        </div>
                        <div className="reorder-bar">
                            <button
                                type="button"
                                className="reorder-action"
                                onClick={() => onReorder(order)}
                            >
                                {t("orderAgain")}
                            </button>
                            <span className="reorder-price">
                                <span className="reorder-amount">{formatAmount(order.amount)}</span>
                                <small className="reorder-created">
                                    {t("createdOn")}: {formatDay(order.createdAt)}
                                </small>
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
