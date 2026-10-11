import { useCallback, useEffect, useState } from "react";
import { listOrders } from "./api/orders";
import { catalog, findProduct } from "./catalog";
import { CartPanel } from "./components/CartPanel";
import { OrderDetail } from "./components/OrderDetail";
import { OrderList } from "./components/OrderList";
import { ProductGrid } from "./components/ProductGrid";
import { StoreHeader, type Screen } from "./components/StoreHeader";
import { t } from "./i18n";
import type { Order } from "./types/order";

const favoritesKey = "favorites";
const cartKey = "cart";

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
    document.title = t("title");
    document.documentElement.lang = navigator.language;
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 2000);
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
  const heading =
    screen === "orders" ? t("orders") : screen === "cart" ? t("cart") : screen === "favorites" ? t("favorites") : t("catalog");

  return (
    <div className="shell">
      <StoreHeader
        screen={screen}
        favoriteCount={favoriteIds.length}
        cartCount={cartId ? 1 : 0}
        onNavigate={setScreen}
      />
      <main className="page">
        <h1>{heading}</h1>
        {screen === "catalog" ? <p className="lede">{t("subtitle")}</p> : null}
        {screen === "catalog" || screen === "favorites" ? (
          <ProductGrid
            products={visibleProducts}
            favoriteIds={favoriteIds}
            cartId={cartId}
            onToggleFavorite={toggleFavorite}
            onAddToCart={setCartId}
          />
        ) : null}
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
        ) : null}
        {screen === "orders" ? (
          <section className="panel orders">
            {loadError ? <p className="field-error">{loadError}</p> : null}
            <OrderList orders={orders} selectedId={selectedId} onSelect={setSelectedId} />
            {selected ? <OrderDetail order={selected} onClose={() => setSelectedId(null)} /> : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
