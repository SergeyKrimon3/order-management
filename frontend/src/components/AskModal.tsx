import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { askOrders } from "../api/insights";
import { t } from "../i18n";
import { Icon, iconPaths } from "./Icon";

const questionLimit = 1000;

interface AskModalProps {
    onClose: () => void;
}

export function AskModal({ onClose }: AskModalProps) {
    const titleId = useId();
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    const requestRef = useRef<AbortController | null>(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [error, setError] = useState("");
    const [asking, setAsking] = useState(false);

    useEffect(() => {
        fieldRef.current?.focus();
        return () => {
            requestRef.current?.abort();
        };
    }, []);

    function close() {
        requestRef.current?.abort();
        onClose();
    }

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmed = question.trim();
        if (trimmed.length === 0) {
            setQuestion("");
            return;
        }

        if (asking) {
            return;
        }

        const controller = new AbortController();
        requestRef.current = controller;
        setAsking(true);
        setError("");
        setAnswer("");
        try {
            setAnswer(await askOrders(trimmed, controller.signal));
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === "AbortError") {
                return;
            }

            setError(t("askError"));
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setAsking(false);
            }
        }
    }

    const missing = question.trim().length === 0;

    return (
        <div className="modal-backdrop">
            <form
                className="panel form modal ask-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                onClick={(event) => event.stopPropagation()}
                onSubmit={(event) => void onSubmit(event)}
            >
                <div className="modal-head">
                    <h2 id={titleId}>{t("askTitle")}</h2>
                    <button type="button" className="icon-button modal-close" onClick={close} aria-label={t("close")}>
                        <Icon paths={iconPaths.closeCircle} />
                    </button>
                </div>
                <label className={missing ? "is-invalid" : undefined}>
                    <span>{t("askLabel")}</span>
                    <textarea
                        ref={fieldRef}
                        value={question}
                        maxLength={questionLimit}
                        rows={5}
                        placeholder={t("askPlaceholder")}
                        aria-invalid={missing}
                        disabled={asking}
                        onChange={(event) => setQuestion(event.target.value)}
                    />
                    <span className="ask-foot">
                        {missing ? (
                            <span className="field-required">{t("requiredField")}</span>
                        ) : (
                            <span className="ask-count">{question.length} / {questionLimit}</span>
                        )}
                    </span>
                </label>
                {asking ? (
                    <p className="ask-thinking" role="status">
                        {t("asking")}
                        <span className="ask-thinking-dots" aria-hidden="true">
                            <span />
                            <span />
                            <span />
                        </span>
                    </p>
                ) : null}
                {error ? <p className="field-error">{error}</p> : null}
                {answer ? <p className="ask-answer">{answer}</p> : null}
                <div className="modal-submit">
                    <button type="submit" className="reorder-action" disabled={asking || missing}>
                        {t("askSubmit")}
                    </button>
                </div>
            </form>
        </div>
    );
}
