import { useState, type FormEvent } from "react";
import { createOrder } from "../api/orders";
import type { CatalogProduct } from "../catalog";
import { formatAmount } from "../format";
import { t } from "../i18n";
import type { Order } from "../types/order";

interface CartPanelProps {
    product: CatalogProduct | null;
    onBrowse: () => void;
    onCreated: (order: Order) => void;
}

export function CartPanel({ product, onBrowse, onCreated }: CartPanelProps) {
    const [customer, setCustomer] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    if (!product) {
        return (
            <section className="panel cart-empty">
                <p className="empty">{t("emptyCart")}</p>
                <button type="button" className="buy blue" onClick={onBrowse}>
                    {t("backToCatalog")}
                </button>
            </section>
        );
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!product) {
            return;
        }

        if (customer.trim().length === 0) {
            setError(t("customerRequired"));
            return;
        }

        setError("");
        setSaving(true);
        try {
            const order = await createOrder({
                customer: customer.trim(),
                product: t(product.nameKey),
                amount: product.price,
                image: product.image,
            });
            setCustomer("");
            onCreated(order);
        } catch {
            setError(t("saveError"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="panel form cart-panel" onSubmit={handleSubmit}>
            <p className="hint">{t("cartHint")}</p>
            <div className="cart-item">
                <img src={product.image} alt="" />
                <div>
                    <strong>{t(product.nameKey)}</strong>
                    <span>{formatAmount(product.price)}</span>
                </div>
            </div>
            <label>
                {t("customer")}
                <input
                    value={customer}
                    onChange={(event) => setCustomer(event.target.value)}
                    autoComplete="name"
                />
            </label>
            {error ? <p className="field-error">{error}</p> : null}
            <button type="submit" className="buy blue" disabled={saving}>
                {saving ? t("checkingOut") : t("checkout")}
            </button>
        </form>
    );
}
