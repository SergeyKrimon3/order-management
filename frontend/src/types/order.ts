export type OrderStatus = "Pendente" | "Processando" | "Finalizado";

export interface Order {
  id: string;
  customer: string;
  product: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
}

export interface CreateOrderInput {
  customer: string;
  product: string;
  amount: number;
}
