import { useCallback, useEffect, useRef, useState } from "react";
import { addFavorite, isOrderId, listFavorites, removeFavorite } from "./api/favorites";
import { listOrders } from "./api/orders";
import { CreateOrderModal } from "./components/CreateOrderModal";
import { OrderPage } from "./components/OrderPage";
import { AskModal } from "./components/AskModal";
import { OrderList } from "./components/OrderList";
import { OrderRail } from "./components/OrderRail";
import { ProductGrid } from "./components/ProductGrid";
import { StoreHeader, type Screen } from "./components/StoreHeader";
import { ThemeToggle } from "./components/ThemeToggle";
import { Icon, iconPaths } from "./components/Icon";
import { t, type MessageKey } from "./i18n";
import { watchOrderEvents } from "./orderEvents";
import type { Order } from "./types/order";

const favoritesKey = "favorites";
const orderPath = /^\/orders\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

function orderPageId(): string | null {
    return orderPath.exec(window.location.pathname)?.[1] ?? null;
}

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
    const pageId = orderPageId();
    if (pageId !== null) {
        return <OrderPage id={pageId} />;
    }

    return <StoreApp />;
}

const openOrdersKey = "store-open-orders";

function initialScreen(): Screen {
    const params = new URLSearchParams(window.location.search);
    if (params.has("screen")) {
        params.delete("screen");
        const search = params.toString();
        window.history.replaceState(null, "", `${window.location.pathname}${search.length > 0 ? `?${search}` : ""}${window.location.hash}`);
    }

    try {
        if (sessionStorage.getItem(openOrdersKey) === "1") {
            sessionStorage.removeItem(openOrdersKey);
            return "orders";
        }
    } catch {
        return "catalog";
    }

    return "catalog";
}

function StoreApp() {
    const [screen, setScreen] = useState<Screen>(initialScreen);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadError, setLoadError] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [repeatOrder, setRepeatOrder] = useState<Order | null>(null);
    const [trackedId, setTrackedId] = useState<string | null>(null);
    const [askOpen, setAskOpen] = useState(false);
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
        void refresh();
        return watchOrderEvents(() => {
            void refresh();
        });
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

    const completedOrders = orders.filter((order) => order.status === "completed");
    const catalogOrders = completedOrders.filter((order) => order.repeatOf === null);
    const favoriteOrders = catalogOrders.filter((order) => favoriteIds.includes(order.id));
    const visibleOrders = screen === "favorites" ? favoriteOrders : catalogOrders;

    function openOrder(id: string) {
        window.location.assign(`/orders/${id}`);
    }

    return (
        <div className="noite">
            <div className="noite-main">
                <StoreHeader screen={screen} onNavigate={setScreen} />
                {screen === "orders" ? (
                    <section className="orders-board">
                        <h1>{t("orders")}</h1>
                        {loadError ? <p className="field-error">{loadError}</p> : null}
                        <OrderList orders={orders} onSelect={openOrder} />
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
                        <span className="tip is-below" aria-hidden="true">{t("favorites")}</span>
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        aria-label={t("askHint")}
                        onClick={() => setAskOpen(true)}
                    >
                        <Icon paths={iconPaths.spark} />
                        <span className="tip is-below" aria-hidden="true">{t("askHint")}</span>
                    </button>
                    <ThemeToggle />
                </div>
                <h2>{t("ordersNow")}</h2>
                <div className="rail-scroll">
                    {loadError ? <p className="field-error">{loadError}</p> : null}
                    <OrderRail orders={orders} onSelect={openOrder} />
                </div>
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
            {askOpen ? <AskModal onClose={() => setAskOpen(false)} /> : null}
        </div>
    );
}
