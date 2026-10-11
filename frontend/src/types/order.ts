export type OrderStatus = "pending" | "processing" | "finished";

export interface Order {
    id: string;
    customer: string;
    product: string;
    amount: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
    image: string | null;
}

export interface CreateOrderInput {
    customer: string;
    product: string;
    amount: number;
    image: string | null;
}
