import { catalog } from "../catalog";
import { formatAmount } from "../format";
import { t } from "../i18n";
import type { Order } from "../types/order";
import { Icon, iconPaths } from "./Icon";

interface ProductGridProps {
    orders: readonly Order[];
    favoriteIds: readonly string[];
    cartId: string | null;
    onToggleFavorite: (id: string) => void;
    onAddToCart: (id: string) => void;
    onOpen: (id: string) => void;
    onCreateOrder?: () => void;
}

function catalogIdFor(order: Order): string | null {
    const match = catalog.find((product) => product.image === order.image);
    return match?.id ?? null;
}

export function ProductGrid({
    orders,
    favoriteIds,
    cartId,
    onToggleFavorite,
    onAddToCart,
    onOpen,
    onCreateOrder,
}: ProductGridProps) {
    if (orders.length === 0 && !onCreateOrder) {
        return <p className="empty">{t("emptyFavorites")}</p>;
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
                const catalogId = catalogIdFor(order);
                return (
                    <li key={order.id} className="photo-card">
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
                            className={favorite ? "heart-float is-on" : "heart-float"}
                            aria-label={favorite ? t("favoriteRemove") : t("favoriteAdd")}
                            aria-pressed={favorite}
                            onClick={() => onToggleFavorite(order.id)}
                        >
                            <Icon paths={iconPaths.heart} filled={favorite} />
                        </button>
                        <div className="shade" />
                        <div className="cap">
                            <span className="cap-copy">
                                <strong>{order.product}</strong>
                                <small>{order.customer}</small>
                            </span>
                            <button
                                type="button"
                                className={catalogId !== null && catalogId === cartId ? "buy blue" : "buy ghost"}
                                onClick={() => {
                                    if (catalogId) {
                                        onAddToCart(catalogId);
                                        return;
                                    }

                                    onOpen(order.id);
                                }}
                            >
                                {formatAmount(order.amount)}
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
