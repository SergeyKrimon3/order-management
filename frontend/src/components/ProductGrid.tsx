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

  const featuredId = cartId ?? products[0]?.id;

  return (
    <ul className="photo-grid">
      {products.map((product) => {
        const favorite = favoriteIds.includes(product.id);
        return (
          <li key={product.id} className="photo-card">
            <img src={product.image} alt={t(product.nameKey)} />
            <button
              type="button"
              className={favorite ? "heart-float is-on" : "heart-float"}
              aria-label={favorite ? t("favoriteRemove") : t("favoriteAdd")}
              aria-pressed={favorite}
              onClick={() => onToggleFavorite(product.id)}
            >
              <Icon paths={iconPaths.heart} filled={favorite} />
            </button>
            <div className="shade" />
            <div className="cap">
              <strong>{t(product.nameKey)}</strong>
              <button
                type="button"
                className={product.id === featuredId ? "buy blue" : "buy ghost"}
                onClick={() => onAddToCart(product.id)}
              >
                {formatAmount(product.price)}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
