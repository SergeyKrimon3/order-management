import type { ProductIcon } from "./components/Icon";
import type { MessageKey } from "./i18n";

export interface CatalogProduct {
  id: string;
  nameKey: MessageKey;
  price: number;
  icon: ProductIcon;
}

export const catalog: readonly CatalogProduct[] = [
  { id: "caderno", nameKey: "productNotebook", price: 25, icon: "book" },
  { id: "bloco", nameKey: "productNotepad", price: 14, icon: "note" },
  { id: "cafe", nameKey: "productCoffee", price: 18, icon: "coffee" },
  { id: "fone", nameKey: "productHeadphones", price: 189, icon: "headphone" },
  { id: "sacola", nameKey: "productTote", price: 59, icon: "bag" },
  { id: "marcador", nameKey: "productBookmark", price: 9, icon: "bookmark" },
];

export function findProduct(id: string): CatalogProduct | null {
  return catalog.find((product) => product.id === id) ?? null;
}
