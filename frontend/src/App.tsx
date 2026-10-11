import { useCallback, useEffect, useState } from "react";
import { listOrders } from "./api/orders";
import { catalog, findProduct } from "./catalog";
import { CartPanel } from "./components/CartPanel";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { OrderDetail } from "./components/OrderDetail";
import { OrderList } from "./components/OrderList";
import { OrderRail } from "./components/OrderRail";
import { ProductGrid } from "./components/ProductGrid";
import { StoreHeader, type Screen } from "./components/StoreHeader";
import { ThemeToggle } from "./components/ThemeToggle";
import { Icon, iconPaths } from "./components/Icon";
import { t, type MessageKey } from "./i18n";
import type { Order } from "./types/order";

const favoritesKey = "favorites";
const cartKey = "cart";

const screenTitle: Record<Screen, MessageKey> = {
    catalog: "catalog",
    favorites: "favorites",
    cart: "cart",
    orders: "orders",
};

function readFavorites(): string[] {
    try {
        const raw = localStorage.getItem(favoritesKey);
        if (!raw) {
            return [];
        }

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter((item): item is string => typeof item === "string" && findProduct(item) !== null);
    } catch {
        return [];
    }
}

function readCart(): string | null {
    const stored = localStorage.getItem(cartKey);
    return stored && findProduct(stored) ? stored : null;
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("catalog");
    const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites);
    const [cartId, setCartId] = useState<string | null>(readCart);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState("");
    const [createOpen, setCreateOpen] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const items = await listOrders();
            setOrders(items);
            setLoadError("");
        } catch {
            setLoadError(t("loadError"));
        }
    }, []);

    useEffect(() => {
        document.title = `TMB | ${t(screenTitle[screen])}`;
    }, [screen]);

    useEffect(() => {
        document.documentElement.lang = navigator.language;
    }, []);

    useEffect(() => {
        void refresh();
        const timer = window.setInterval(() => {
            void refresh();
        }, 1000);
        return () => window.clearInterval(timer);
    }, [refresh]);

    useEffect(() => {
        localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
    }, [favoriteIds]);

    useEffect(() => {
        if (cartId) {
            localStorage.setItem(cartKey, cartId);
            return;
        }

        localStorage.removeItem(cartKey);
    }, [cartId]);

    function toggleFavorite(id: string) {
        setFavoriteIds((current) =>
            current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        );
    }

    const selected = orders.find((order) => order.id === selectedId) ?? null;
    const visibleProducts =
        screen === "favorites" ? catalog.filter((product) => favoriteIds.includes(product.id)) : catalog;

    return (
        <div className="noite">
            <div className="noite-main">
                <StoreHeader screen={screen} onNavigate={setScreen} />
                {screen === "orders" ? (
                    <section className="orders-board">
                        <h1>{t("orders")}</h1>
                        {loadError ? <p className="field-error">{loadError}</p> : null}
                        <OrderList orders={orders} selectedId={selectedId} onSelect={setSelectedId} />
                        {selected ? (
                            <OrderDetail order={selected} onClose={() => setSelectedId(null)} />
                        ) : null}
                    </section>
                ) : (
                    <ProductGrid
                        products={visibleProducts}
                        favoriteIds={favoriteIds}
                        cartId={cartId}
                        onToggleFavorite={toggleFavorite}
                        onAddToCart={(id) => {
                            setCartId(id);
                            setScreen("catalog");
                        }}
                        onCreateOrder={screen === "catalog" ? () => setCreateOpen(true) : undefined}
                    />
                )}
            </div>
            <aside className="noite-rail">
                <div className="rail-tools">
                    <button
                        type="button"
                        className={screen === "favorites" ? "icon-button active" : "icon-button"}
                        aria-label={t("favorites")}
                        onClick={() => setScreen(screen === "favorites" ? "catalog" : "favorites")}
                    >
                        <Icon paths={iconPaths.heart} filled={favoriteIds.length > 0} />
                        {favoriteIds.length > 0 ? <span className="badge">{favoriteIds.length}</span> : null}
                    </button>
                    <button
                        type="button"
                        className={screen === "cart" ? "icon-button active" : "icon-button"}
                        aria-label={t("cart")}
                        onClick={() => setScreen(screen === "cart" ? "catalog" : "cart")}
                    >
                        <Icon paths={iconPaths.cart} />
                        {cartId ? <span className="badge">1</span> : null}
                    </button>
                    <ThemeToggle />
                </div>
                {screen === "cart" ? (
                    <CartPanel
                        product={cartId ? findProduct(cartId) : null}
                        onBrowse={() => setScreen("catalog")}
                        onCreated={(order) => {
                            setCartId(null);
                            setSelectedId(order.id);
                            setScreen("orders");
                            void refresh();
                        }}
                    />
                ) : (
                    <>
                        <h2>{t("ordersNow")}</h2>
                        {loadError ? <p className="field-error">{loadError}</p> : null}
                        <OrderRail
                            orders={orders}
                            selectedId={selectedId}
                            onSelect={(id) => {
                                setSelectedId(id);
                                setScreen("orders");
                            }}
                        />
                    </>
                )}
            </aside>
            {createOpen ? (
                <CreateOrderModal
                    onClose={() => setCreateOpen(false)}
                    onCreated={(order) => {
                        setCreateOpen(false);
                        setSelectedId(order.id);
                        setScreen("orders");
                        void refresh();
                    }}
                />
            ) : null}
        </div>
    );
}
