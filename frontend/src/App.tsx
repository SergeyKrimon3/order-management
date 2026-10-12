import { useCallback, useEffect, useRef, useState } from "react";
import { addFavorite, isOrderId, listFavorites, removeFavorite } from "./api/favorites";
import { listOrders } from "./api/orders";
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

const screenTitle: Record<Screen, MessageKey> = {
    catalog: "catalog",
    favorites: "favorites",
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

        return parsed.filter((item): item is string => typeof item === "string" && item.length > 0);
    } catch {
        return [];
    }
}

export default function App() {
    const [screen, setScreen] = useState<Screen>("catalog");
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [repeatOrder, setRepeatOrder] = useState<Order | null>(null);
    const [trackedId, setTrackedId] = useState<string | null>(null);
    const refreshGeneration = useRef(0);

    const refresh = useCallback(async () => {
        const generation = refreshGeneration.current + 1;
        refreshGeneration.current = generation;
        try {
            const items = await listOrders();
            if (generation !== refreshGeneration.current) {
                return;
            }

            setOrders(items);
            setLoadError("");
        } catch {
            if (generation === refreshGeneration.current) {
                setLoadError(t("loadError"));
            }
        }
    }, []);

    useEffect(() => {
        document.title = `TMB | ${t(screenTitle[screen])}`;
    }, [screen]);

    useEffect(() => {
        document.documentElement.lang = navigator.language;
    }, []);

    useEffect(() => {
        const source = new EventSource("/api/orders/events");
        source.onmessage = () => {
            void refresh();
        };
        void refresh();
        return () => source.close();
    }, [refresh]);

    useEffect(() => {
        let cancelled = false;

        async function loadFavorites() {
            const stored = readFavorites().filter(isOrderId);
            try {
                for (const id of stored) {
                    try {
                        await addFavorite(id);
                    } catch {
                        continue;
                    }
                }

                const items = await listFavorites();
                localStorage.removeItem(favoritesKey);
                localStorage.removeItem("cart");
                if (!cancelled) {
                    setFavoriteIds(items.map((item) => item.orderId));
                }
            } catch {
                if (!cancelled) {
                    setFavoriteIds(stored);
                }
            }
        }

        void loadFavorites();
        return () => {
            cancelled = true;
        };
    }, []);

    function toggleFavorite(id: string) {
        const exists = favoriteIds.includes(id);
        setFavoriteIds((current) =>
            exists ? current.filter((item) => item !== id) : [...current, id],
        );

        const request = exists ? removeFavorite(id) : addFavorite(id);
        void request.catch(() => {
            setFavoriteIds((current) =>
                exists ? [...current, id] : current.filter((item) => item !== id),
            );
        });
    }

    const selected = orders.find((order) => order.id === selectedId) ?? null;
    const completedOrders = orders.filter((order) => order.status === "completed");
    const catalogOrders = completedOrders.filter((order) => order.repeatOf === null);
    const favoriteOrders = catalogOrders.filter((order) => favoriteIds.includes(order.id));
    const visibleOrders = screen === "favorites" ? favoriteOrders : catalogOrders;

    function openOrder(id: string) {
        setSelectedId(id);
        setScreen("orders");
    }

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
                        orders={visibleOrders}
                        favoriteIds={favoriteIds}
                        onToggleFavorite={toggleFavorite}
                        onOpen={openOrder}
                        onReorder={(order) => {
                            if (createOpen) {
                                return;
                            }

                            setRepeatOrder(order);
                            setCreateOpen(true);
                        }}
                        onCreateOrder={screen === "catalog" ? () => {
                            setRepeatOrder(null);
                            setCreateOpen(true);
                        } : undefined}
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
                        <Icon paths={iconPaths.heart} filled={favoriteOrders.length > 0} />
                        {favoriteOrders.length > 0 ? <span className="badge">{favoriteOrders.length}</span> : null}
                    </button>
                    <ThemeToggle />
                </div>
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
            </aside>
            {createOpen ? (
                <CreateOrderModal
                    liveOrder={orders.find((order) => order.id === trackedId) ?? null}
                    repeatOrder={repeatOrder}
                    onClose={() => {
                        setCreateOpen(false);
                        setRepeatOrder(null);
                        setTrackedId(null);
                    }}
                    onCreated={(order) => {
                        setTrackedId(order.id);
                        setOrders((current) => [order, ...current.filter((item) => item.id !== order.id)]);
                        void refresh();
                    }}
                />
            ) : null}
        </div>
    );
}
