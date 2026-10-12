import { useEffect, useRef, useState } from "react";
import { getOrder, OrderRequestError } from "../api/orders";
import { formatAmount, formatDate, statusLabel, stepCaption } from "../format";
import { t, type MessageKey } from "../i18n";
import type { Order } from "../types/order";
import { ThemeToggle } from "./ThemeToggle";
import { WorkerDots } from "./WorkerDots";

interface OrderPageProps {
    id: string;
}

export function OrderPage({ id }: OrderPageProps) {
    const [order, setOrder] = useState<Order | null>(null);
    const [error, setError] = useState<MessageKey | "">("");
    const generation = useRef(0);

    useEffect(() => {
        document.title = `TMB | ${t("detail")}`;
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            const current = generation.current + 1;
            generation.current = current;
            try {
                const next = await getOrder(id);
                if (cancelled || current !== generation.current) {
                    return;
                }

                setOrder(next);
                setError("");
                document.title = `TMB | ${next.product}`;
            } catch (caught: unknown) {
                if (cancelled || current !== generation.current) {
                    return;
                }

                setOrder(null);
                const missing = caught instanceof OrderRequestError && caught.status === 404;
                setError(missing ? "orderNotFound" : "orderLoadError");
            }
        }

        void load();
        const source = new EventSource("/api/orders/events");
        source.onmessage = () => {
            void load();
        };

        return () => {
            cancelled = true;
            source.close();
        };
    }, [id]);

    return (
        <div className="noite is-solo">
            <div className="noite-main">
                <header className="topbar">
                    <a className="brand" href="/">
                        <span className="brand-name">{t("title")}</span>
                        <span className="brand-tagline">{t("brandTagline")}</span>
                    </a>
                    <nav className="nav" aria-label={t("menu")}>
                        <a href="/">{t("catalog")}</a>
                        <a
                            href="/"
                            onClick={() => {
                                sessionStorage.setItem("store-open-orders", "1");
                            }}
                        >
                            {t("orders")}
                        </a>
                    </nav>
                    <ThemeToggle />
                </header>
                <article className="order-sheet">
                    {error ? <p className="field-error">{t(error)}</p> : null}
                    {order ? (
                        <>
                            {order.image ? <img className="order-sheet-photo" src={order.image} alt="" /> : null}
                            <h1>{order.product}</h1>
                            <p className="order-sheet-id">{order.id}</p>
                            <dl className="order-facts">
                                <div>
                                    <dt>{t("customer")}</dt>
                                    <dd>{order.customer}</dd>
                                </div>
                                <div>
                                    <dt>{t("amount")}</dt>
                                    <dd>{formatAmount(order.amount)}</dd>
                                </div>
                                <div>
                                    <dt>{t("status")}</dt>
                                    <dd>
                                        <span className="order-lead is-stacked">
                                            <span className={`pill ${order.status}`}>{statusLabel(order.status)}</span>
                                            <span className="step-caption">{stepCaption(order.status)}</span>
                                            <WorkerDots status={order.status} />
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt>{t("createdAt")}</dt>
                                    <dd>{formatDate(order.createdAt)}</dd>
                                </div>
                                <div>
                                    <dt>{t("updatedAt")}</dt>
                                    <dd>{formatDate(order.updatedAt)}</dd>
                                </div>
                            </dl>
                        </>
                    ) : null}
                </article>
            </div>
        </div>
    );
}
