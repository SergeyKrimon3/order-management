import { ThemeToggle } from "./ThemeToggle";
import { Icon, iconPaths } from "./Icon";
import { t } from "../i18n";

export type Screen = "catalog" | "favorites" | "cart" | "orders";

interface StoreHeaderProps {
  screen: Screen;
  favoriteCount: number;
  cartCount: number;
  onNavigate: (screen: Screen) => void;
}

export function StoreHeader({ screen, favoriteCount, cartCount, onNavigate }: StoreHeaderProps) {
  return (
    <header className="topbar">
      <button type="button" className="brand" onClick={() => onNavigate("catalog")}>
        {t("title")}
      </button>
      <nav className="nav" aria-label={t("menu")}>
        <button
          type="button"
          className={screen === "catalog" ? "active" : undefined}
          onClick={() => onNavigate("catalog")}
        >
          {t("catalog")}
        </button>
        <button
          type="button"
          className={screen === "orders" ? "active" : undefined}
          onClick={() => onNavigate("orders")}
        >
          {t("orders")}
        </button>
      </nav>
      <div className="topbar-actions">
        <button
          type="button"
          className={screen === "favorites" ? "icon-button active" : "icon-button"}
          aria-label={t("favorites")}
          onClick={() => onNavigate("favorites")}
        >
          <Icon paths={iconPaths.heart} filled={favoriteCount > 0} />
          {favoriteCount > 0 ? <span className="badge">{favoriteCount}</span> : null}
        </button>
        <button
          type="button"
          className={screen === "cart" ? "icon-button active" : "icon-button"}
          aria-label={t("cart")}
          onClick={() => onNavigate("cart")}
        >
          <Icon paths={iconPaths.cart} />
          {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
