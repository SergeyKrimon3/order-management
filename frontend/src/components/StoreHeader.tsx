import { t } from "../i18n";

export type Screen = "catalog" | "favorites" | "orders";

interface StoreHeaderProps {
    screen: Screen;
    onNavigate: (screen: Screen) => void;
}

export function StoreHeader({ screen, onNavigate }: StoreHeaderProps) {
    const catalogOn = screen === "catalog" || screen === "favorites";

    return (
        <header className="topbar">
            <button type="button" className="brand" onClick={() => onNavigate("catalog")}>
                <span className="brand-name">{t("title")}</span>
                <span className="brand-tagline">{t("brandTagline")}</span>
            </button>
            <nav className="nav" aria-label={t("menu")}>
                <button type="button" className={catalogOn ? "active" : undefined} onClick={() => onNavigate("catalog")}>
                    {t("catalog")}
                </button>
                <button type="button" className={screen === "orders" ? "active" : undefined} onClick={() => onNavigate("orders")}>
                    {t("orders")}
                </button>
            </nav>
        </header>
    );
}
