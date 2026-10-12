export type OrderStatus = "pending" | "processing" | "completed";

export interface OrderStatusChange {
    id: number;
    status: OrderStatus;
    occurredAt: string;
}

export interface Order {
    id: string;
    customer: string;
    product: string;
    amount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    image: string | null;
    repeatOf: string | null;
    history?: OrderStatusChange[];
}

export interface CreateOrderInput {
    customer: string;
    product: string;
    amount: number;
    image: string | null;
    repeatOf?: string | null;
}
