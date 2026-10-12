const orderIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Favorite {
    orderId: string;
    createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isFavorite(value: unknown): value is Favorite {
    return isRecord(value) && typeof value.orderId === "string" && typeof value.createdAt === "string";
}

export function isOrderId(value: string): boolean {
    return orderIdPattern.test(value);
}

export async function listFavorites(): Promise<Favorite[]> {
    const response = await fetch("/api/favorites");
    if (!response.ok) {
        throw new Error("Invalid favorite list.");
    }

    const body: unknown = await response.json();
    if (!Array.isArray(body) || !body.every(isFavorite)) {
        throw new Error("Invalid favorite list.");
    }

    return body;
}

export async function addFavorite(orderId: string): Promise<void> {
    const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
    });

    if (!response.ok) {
        throw new Error("Favorite was not saved.");
    }
}

export async function removeFavorite(orderId: string): Promise<void> {
    const response = await fetch(`/api/favorites/${orderId}`, { method: "DELETE" });
    if (!response.ok) {
        throw new Error("Favorite was not removed.");
    }
}
