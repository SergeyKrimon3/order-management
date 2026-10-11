import type { CatalogProduct } from "../catalog";
import { formatAmount } from "../format";
import { t } from "../i18n";
import { Icon, iconPaths } from "./Icon";

interface ProductGridProps {
  products: readonly CatalogProduct[];
  favoriteIds: readonly string[];
  cartId: string | null;
  onToggleFavorite: (id: string) => void;
  onAddToCart: (id: string) => void;
}

export function ProductGrid({
  products,
  favoriteIds,
  cartId,
  onToggleFavorite,
  onAddToCart,
}: ProductGridProps) {
  if (products.length === 0) {
    return <p className="empty">{t("emptyFavorites")}</p>;
  }

  return (
    <ul className="catalog-grid">
      {products.map((product) => {
        const favorite = favoriteIds.includes(product.id);
        const inCart = cartId === product.id;
        return (
          <li key={product.id} className="product-card">
            <div className="product-mark">
              <Icon paths={iconPaths[product.icon]} />
              <button
                type="button"
                className={favorite ? "heart-button is-on" : "heart-button"}
                aria-label={favorite ? t("favoriteRemove") : t("favoriteAdd")}
                aria-pressed={favorite}
                onClick={() => onToggleFavorite(product.id)}
              >
                <Icon paths={iconPaths.heart} filled={favorite} />
              </button>
            </div>
            <div className="product-copy">
              <strong>{t(product.nameKey)}</strong>
              <span>{formatAmount(product.price)}</span>
            </div>
            <button type="button" className="primary-button" onClick={() => onAddToCart(product.id)}>
              {inCart ? t("inCart") : t("addToCart")}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
