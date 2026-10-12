import { formatAmount, formatDate, statusLabel } from "../format";
import { t } from "../i18n";
import type { Order, OrderStatus } from "../types/order";

interface OrderDetailProps {
    order: Order;
    onClose: () => void;
}

const steps: readonly OrderStatus[] = ["pending", "processing", "completed"];

const stepText: Record<OrderStatus, "stepPending" | "stepProcessing" | "stepFinished"> = {
    pending: "stepPending",
    processing: "stepProcessing",
    completed: "stepFinished",
};

export function OrderDetail({ order, onClose }: OrderDetailProps) {
    const current = steps.indexOf(order.status);

    return (
        <section className="panel detail">
            <div className="detail-head">
                <h2>{t("detail")}</h2>
                <button type="button" className="ghost" onClick={onClose}>
                    {t("close")}
                </button>
            </div>
            {order.image ? <img className="detail-photo" src={order.image} alt="" /> : null}
            <dl>
                <div>
                    <dt>{t("customer")}</dt>
                    <dd>{order.customer}</dd>
                </div>
                <div>
                    <dt>{t("product")}</dt>
                    <dd>{order.product}</dd>
                </div>
                <div>
                    <dt>{t("amount")}</dt>
                    <dd>{formatAmount(order.amount)}</dd>
                </div>
                <div>
                    <dt>{t("createdAt")}</dt>
                    <dd>{formatDate(order.createdAt)}</dd>
                </div>
            </dl>
            <ol className="steps">
                {steps.map((step, index) => {
                    const state = index < current ? "done" : index === current ? "current" : "waiting";
                    return (
                        <li key={step} className={`${step} ${state}`}>
                            <span className={`pill ${step}`}>{statusLabel(step)}</span>
                            <span>{t(stepText[step])}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}
