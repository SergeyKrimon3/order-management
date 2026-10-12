import type { OrderStatus } from "../types/order";

interface WorkerDotsProps {
    status: OrderStatus;
}

export function WorkerDots({ status }: WorkerDotsProps) {
    if (status === "completed") {
        return null;
    }

    return (
        <span className={`worker-dots ${status}`} aria-hidden="true">
            <span />
            <span />
            <span />
        </span>
    );
}
