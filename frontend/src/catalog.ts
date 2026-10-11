import type { ProductIcon } from "./components/Icon";
import type { MessageKey } from "./i18n";

export interface CatalogProduct {
    id: string;
    nameKey: MessageKey;
    price: number;
    icon: ProductIcon;
    image: string;
}

export const catalog: readonly CatalogProduct[] = [
    {
        id: "sacola",
        nameKey: "productTote",
        price: 59,
        icon: "bag",
        image: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "fone",
        nameKey: "productHeadphones",
        price: 189,
        icon: "headphone",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "cafe",
        nameKey: "productCoffee",
        price: 18,
        icon: "coffee",
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "caderno",
        nameKey: "productNotebook",
        price: 25,
        icon: "book",
        image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "bloco",
        nameKey: "productNotepad",
        price: 14,
        icon: "note",
        image: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80",
    },
    {
        id: "marcador",
        nameKey: "productBookmark",
        price: 9,
        icon: "bookmark",
        image: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=900&q=80",
    },
];

export function findProduct(id: string): CatalogProduct | null {
    return catalog.find((product) => product.id === id) ?? null;
}

export function findProductByLabel(label: string, nameOf: (product: CatalogProduct) => string): CatalogProduct | null {
    return catalog.find((product) => nameOf(product) === label) ?? null;
}
