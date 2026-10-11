import { useEffect, useId, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createOrder } from "../api/orders";
import { Icon, iconPaths } from "./Icon";
import { t } from "../i18n";
import { imageFileToDataUrl } from "../orderImages";
import type { Order } from "../types/order";

interface CreateOrderModalProps {
    onClose: () => void;
    onCreated: (order: Order) => void;
}

function centsDigits(value: string): string {
    return value.replace(/\D/g, "").replace(/^0+/, "");
}

function formatCents(digits: string): string {
    if (digits.length === 0) {
        return "";
    }

    const padded = digits.padStart(3, "0");
    const whole = padded.slice(0, -2);
    const fraction = padded.slice(-2);
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${grouped},${fraction}`;
}

function amountFromDigits(digits: string): number | null {
    if (digits.length === 0) {
        return null;
    }

    return Number(digits) / 100;
}

function isAllowedImage(file: File): boolean {
    const type = file.type.toLowerCase();
    if (type === "image/jpeg" || type === "image/jpg" || type === "image/png") {
        return true;
    }

    const name = file.name.toLowerCase();
    return name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
}

function imageFromClipboard(data: DataTransfer): File | null {
    const pastedFile = Array.from(data.files).find((item) => item.type.startsWith("image/"));
    if (pastedFile) {
        return pastedFile;
    }

    for (const item of data.items) {
        if (!item.type.startsWith("image/")) {
            continue;
        }

        return item.getAsFile();
    }

    return null;
}

export function CreateOrderModal({ onClose, onCreated }: CreateOrderModalProps) {
    const titleId = useId();
    const customerRef = useRef<HTMLInputElement>(null);
    const imageZoneRef = useRef<HTMLLabelElement>(null);
    const assignFileRef = useRef<(next: File | undefined) => void>(() => undefined);
    const alive = useRef(true);
    const onCloseRef = useRef(onClose);
    const previewUrl = useRef<string | null>(null);
    const [customer, setCustomer] = useState("");
    const [product, setProduct] = useState("");
    const [amountDigits, setAmountDigits] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const customerMissing = customer.trim().length === 0;
    const productMissing = product.trim().length === 0;
    const amountMissing = amountDigits.length === 0;
    const imageMissing = file === null;

    useEffect(() => {
        onCloseRef.current = onClose;
        assignFileRef.current = assignFile;
    });

    useEffect(() => {
        alive.current = true;
        customerRef.current?.focus();
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        let pasteSeen = false;

        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCloseRef.current();
                return;
            }

            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "v") {
                return;
            }

            window.setTimeout(() => {
                if (pasteSeen) {
                    pasteSeen = false;
                    return;
                }

                void readClipboardImage();
            }, 0);
        }

        function onPaste(event: ClipboardEvent) {
            pasteSeen = true;
            if (!event.clipboardData) {
                return;
            }

            const pasted = imageFromClipboard(event.clipboardData);
            if (!pasted) {
                return;
            }

            event.preventDefault();
            assignFileRef.current(pasted);
        }

        async function readClipboardImage() {
            if (!navigator.clipboard?.read) {
                return;
            }

            try {
                const items = await navigator.clipboard.read();
                for (const item of items) {
                    const type = item.types.find((entry) => entry === "image/png" || entry === "image/jpeg" || entry === "image/jpg");
                    if (!type) {
                        continue;
                    }

                    const blob = await item.getType(type);
                    const normalized = type === "image/jpg" ? "image/jpeg" : type;
                    const extension = normalized === "image/png" ? "png" : "jpg";
                    assignFileRef.current(new File([blob], `paste.${extension}`, { type: normalized }));
                    return;
                }
            } catch {
                return;
            }
        }

        document.addEventListener("keydown", onKey);
        document.addEventListener("paste", onPaste, true);
        return () => {
            alive.current = false;
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("paste", onPaste, true);
            if (previewUrl.current) {
                URL.revokeObjectURL(previewUrl.current);
            }
        };
    }, []);

    function assignFile(next: File | undefined) {
        if (!next) {
            return;
        }

        if (!isAllowedImage(next)) {
            setError(t("imageFormatError"));
            return;
        }

        if (previewUrl.current) {
            URL.revokeObjectURL(previewUrl.current);
        }

        const url = URL.createObjectURL(next);
        previewUrl.current = url;
        setError("");
        setFile(next);
        setPreview(url);
    }

    function onDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        assignFile(event.dataTransfer.files[0]);
    }

    function onImagePaste(event: ReactClipboardEvent<HTMLLabelElement>) {
        const pasted = imageFromClipboard(event.clipboardData);
        if (!pasted) {
            return;
        }

        event.preventDefault();
        assignFile(pasted);
    }

    function onAmountKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
        if (event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }

        if (event.key.length === 1 && !/^\d$/.test(event.key)) {
            event.preventDefault();
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const customerName = customer.trim();
        const productName = product.trim();
        const parsedAmount = amountFromDigits(amountDigits);

        if (customerName.length === 0 || productName.length === 0 || parsedAmount === null || parsedAmount <= 0 || file === null) {
            return;
        }

        setError("");
        setSaving(true);

        let dataUrl: string;
        try {
            dataUrl = await imageFileToDataUrl(file);
        } catch {
            if (alive.current) {
                setError(t("imageError"));
                setSaving(false);
            }
            return;
        }

        try {
            const order = await createOrder({
                customer: customerName,
                product: productName,
                amount: parsedAmount,
                image: dataUrl,
            });
            onCreated(order);
        } catch {
            if (alive.current) {
                setError(t("saveError"));
            }
        } finally {
            if (alive.current) {
                setSaving(false);
            }
        }
    }

    return (
        <div className="modal-backdrop">
            <form
                className="panel form modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="modal-head">
                    <h2 id={titleId}>{t("createOrder")}</h2>
                    <button type="button" className="icon-button modal-close" onClick={onClose} aria-label={t("close")}>
                        <Icon paths={iconPaths.closeCircle} />
                    </button>
                </div>
                <label className={customerMissing ? "is-invalid" : undefined}>
                    <span>{t("customer")}</span>
                    <input
                        ref={customerRef}
                        value={customer}
                        onChange={(event) => setCustomer(event.target.value)}
                        autoComplete="name"
                        aria-invalid={customerMissing}
                    />
                    {customerMissing ? <span className="field-required">{t("requiredField")}</span> : null}
                </label>
                <label className={productMissing ? "is-invalid" : undefined}>
                    <span>{t("product")}</span>
                    <input
                        value={product}
                        onChange={(event) => setProduct(event.target.value)}
                        autoComplete="off"
                        aria-invalid={productMissing}
                    />
                    {productMissing ? <span className="field-required">{t("requiredField")}</span> : null}
                </label>
                <label className={amountMissing ? "is-invalid" : undefined}>
                    <span>{t("amount")}</span>
                    <span className="amount-wrap">
                        <span className="amount-prefix" aria-hidden="true">R$</span>
                        <input
                            value={formatCents(amountDigits)}
                            onChange={(event) => setAmountDigits(centsDigits(event.target.value))}
                            onKeyDown={onAmountKeyDown}
                            inputMode="numeric"
                            autoComplete="off"
                            aria-invalid={amountMissing}
                        />
                    </span>
                    {amountMissing ? <span className="field-required">{t("requiredField")}</span> : null}
                </label>
                <div className={imageMissing ? "image-field is-invalid" : "image-field"}>
                    <span>{t("addImage")}</span>
                    <label
                        ref={imageZoneRef}
                        className="image-drop"
                        tabIndex={0}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={onDrop}
                        onPaste={onImagePaste}
                    >
                        {preview ? <img src={preview} alt="" /> : null}
                        {preview ? (
                            <span className="image-drop-label is-overlay">{t("changeImage")}</span>
                        ) : (
                            <span className="image-drop-copy">
                                <span>{t("imageFormatsHint")}</span>
                                <strong>{t("imageFormats")}</strong>
                                <span>{t("imageDropHint")}</span>
                            </span>
                        )}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                            onChange={(event) => assignFile(event.target.files?.[0])}
                        />
                    </label>
                    {imageMissing ? <span className="field-required">{t("requiredField")}</span> : null}
                </div>
                {error ? <p className="field-error">{error}</p> : null}
                <button type="submit" className="buy blue" disabled={saving || imageMissing}>
                    {saving ? t("creatingOrder") : t("createOrder")}
                </button>
            </form>
        </div>
    );
}
