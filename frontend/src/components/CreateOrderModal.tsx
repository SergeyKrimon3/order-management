import { useEffect, useId, useRef, useState, type ClipboardEvent as ReactClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createOrder } from "../api/orders";
import { Icon, iconPaths } from "./Icon";
import { WorkerDots } from "./WorkerDots";
import { formatAmount, formatDay, stepCaption } from "../format";
import { t } from "../i18n";
import { imageFileToDataUrl } from "../orderImages";
import type { Order, OrderStatus } from "../types/order";

interface CreateOrderModalProps {
    liveOrder: Order | null;
    repeatOrder?: Order | null;
    onClose: () => void;
    onCreated: (order: Order) => void;
}

const progressSteps: readonly OrderStatus[] = ["pending", "processing", "completed"];

function stepState(status: OrderStatus, step: OrderStatus): "done" | "current" | "waiting" {
    const current = progressSteps.indexOf(status);
    const index = progressSteps.indexOf(step);
    if (status === "completed" || index < current) {
        return "done";
    }

    if (index === current) {
        return "current";
    }

    return "waiting";
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

const repeatRequests = new Map<string, Promise<Order>>();

function requestRepeat(source: Order): Promise<Order> {
    const current = repeatRequests.get(source.id);
    if (current) {
        return current;
    }

    const request = createOrder({
        customer: source.customer,
        product: source.product,
        amount: source.amount,
        image: source.image,
        repeatOf: source.id,
    }).finally(() => {
        repeatRequests.delete(source.id);
    });

    repeatRequests.set(source.id, request);
    return request;
}

export function CreateOrderModal({ liveOrder, repeatOrder = null, onClose, onCreated }: CreateOrderModalProps) {
    const titleId = useId();
    const customerRef = useRef<HTMLInputElement>(null);
    const imageZoneRef = useRef<HTMLLabelElement>(null);
    const assignFileRef = useRef<(next: File | undefined) => void>(() => undefined);
    const alive = useRef(true);
    const onCloseRef = useRef(onClose);
    const onCreatedRef = useRef(onCreated);
    const allowCloseRef = useRef(true);
    const countdownStarted = useRef(false);
    const previewUrl = useRef<string | null>(null);
    const [customer, setCustomer] = useState("");
    const [product, setProduct] = useState("");
    const [amountDigits, setAmountDigits] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
    const customerMissing = customer.trim().length === 0;
    const productMissing = product.trim().length === 0;
    const amountMissing = amountDigits.length === 0;
    const imageMissing = file === null;
    const progress = liveOrder && createdOrder && liveOrder.id === createdOrder.id ? liveOrder : createdOrder;
    const progressId = progress?.id;
    const progressStatus = progress?.status;
    const allowClose = progressStatus !== "pending" && progressStatus !== "processing";
    allowCloseRef.current = allowClose;

    useEffect(() => {
        if (progressStatus !== "completed" || !progressId || countdownStarted.current) {
            return;
        }

        countdownStarted.current = true;
        setSecondsLeft(10);
        const timer = window.setInterval(() => {
            setSecondsLeft((current) => {
                if (current === null || current <= 1) {
                    window.clearInterval(timer);
                    onCloseRef.current();
                    return 1;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [progressId, progressStatus]);

    useEffect(() => {
        if (!repeatOrder) {
            return;
        }

        let cancelled = false;
        setSaving(true);
        setError("");

        void requestRepeat(repeatOrder)
            .then((order) => {
                if (cancelled) {
                    return;
                }

                setCreatedOrder(order);
                onCreatedRef.current(order);
            })
            .catch(() => {
                if (!cancelled) {
                    setError(t("saveError"));
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setSaving(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [repeatOrder]);

    useEffect(() => {
        onCloseRef.current = onClose;
        onCreatedRef.current = onCreated;
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
                if (allowCloseRef.current) {
                    onCloseRef.current();
                }
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
            if (alive.current) {
                setCreatedOrder(order);
            }
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

    const currentIndex = progress ? progressSteps.indexOf(progress.status) : -1;
    const following = progress !== null || repeatOrder !== null;

    return (
        <div className="modal-backdrop">
            <form
                className={following ? "panel form modal modal-progress" : "panel form modal"}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                onSubmit={progress ? (event) => event.preventDefault() : handleSubmit}
            >
                <div className="modal-head">
                    <h2 id={titleId}>{following ? t("orderProgress") : t("createOrder")}</h2>
                    {allowClose ? (
                        <button type="button" className="icon-button modal-close" onClick={onClose} aria-label={t("close")}>
                            <Icon paths={iconPaths.closeCircle} />
                        </button>
                    ) : null}
                </div>
                {progress ? (
                    <>
                        <ol className="h-stepper">
                            {progressSteps.map((step, index) => {
                                const state = stepState(progress.status, step);
                                return (
                                    <li
                                        key={step}
                                        className={`${step} is-${state}`}
                                        aria-current={index === currentIndex ? "step" : undefined}
                                    >
                                        <span className="h-step-mark">{state === "done" ? "✓" : index + 1}</span>
                                        <span className="h-step-label">{t(step)}</span>
                                        <span className="h-step-caption">{stepCaption(step)}</span>
                                        {state === "current" ? <WorkerDots status={step} /> : <span className="h-step-dots" />}
                                    </li>
                                );
                            })}
                        </ol>
                        <div className="order-summary">
                            <div className="order-summary-photo">
                                {progress.image ? (
                                    <img src={progress.image} alt="" />
                                ) : (
                                    <span>{progress.product.slice(0, 1)}</span>
                                )}
                            </div>
                            <div className="order-summary-copy">
                                <strong>{progress.product}</strong>
                                <span>{t("customer")}: {progress.customer}</span>
                                <span>{progress.id}</span>
                                <span>{t("createdOn")}: {formatDay(progress.createdAt)}</span>
                                <span className="order-summary-amount">{formatAmount(progress.amount)}</span>
                            </div>
                        </div>
                        {progress.status === "completed" ? (
                            <>
                                <p className="modal-success">{t("orderSuccess")}</p>
                                <button type="button" className="buy blue" onClick={onClose}>
                                    {t("close")}
                                </button>
                                {secondsLeft !== null ? (
                                    <p className="modal-countdown">
                                        {t("closeAutomatically").replace("{seconds}", String(secondsLeft))}
                                    </p>
                                ) : null}
                            </>
                        ) : null}
                    </>
                ) : null}
                {!progress && repeatOrder ? (
                    error ? <p className="field-error">{error}</p> : <p className="modal-countdown">{saving ? t("creatingOrder") : null}</p>
                ) : null}
                {progress || repeatOrder ? null : (
                <>
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
                <div className="modal-submit">
                    <button type="submit" className="reorder-action" disabled={saving || imageMissing}>
                        {saving ? t("creatingOrder") : t("createOrder")}
                    </button>
                </div>
                </>
                )}
            </form>
        </div>
    );
}
