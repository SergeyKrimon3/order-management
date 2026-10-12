import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { askOrders } from "../api/insights";
import { formatTime } from "../format";
import { t } from "../i18n";
import { Icon, iconPaths } from "./Icon";

const questionLimit = 1000;

interface AskModalProps {
    onClose: () => void;
}

interface ChatMessage {
    id: number;
    role: "user" | "assistant";
    text: string;
    at: string;
}

export function AskModal({ onClose }: AskModalProps) {
    const titleId = useId();
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    const logRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<AbortController | null>(null);
    const nextId = useRef(1);
    const [question, setQuestion] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [asking, setAsking] = useState(false);

    useEffect(() => {
        return () => {
            requestRef.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!asking) {
            fieldRef.current?.focus();
        }
    }, [asking]);

    useEffect(() => {
        const field = fieldRef.current;
        if (!field) {
            return;
        }

        field.style.height = "0px";
        field.style.height = `${Math.min(field.scrollHeight, 100)}px`;
    }, [question]);

    useEffect(() => {
        const log = logRef.current;
        if (!log) {
            return;
        }

        log.scrollTop = log.scrollHeight;
    }, [messages, asking]);

    function close() {
        requestRef.current?.abort();
        onClose();
    }

    function appendMessage(role: ChatMessage["role"], text: string) {
        const message: ChatMessage = {
            id: nextId.current,
            role,
            text,
            at: new Date().toISOString(),
        };
        nextId.current += 1;
        setMessages((current) => [...current, message]);
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

        appendMessage("user", trimmed);
        setQuestion("");
        const controller = new AbortController();
        requestRef.current = controller;
        setAsking(true);
        try {
            appendMessage("assistant", await askOrders(trimmed, controller.signal));
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === "AbortError") {
                return;
            }

            appendMessage("assistant", t("askError"));
        } finally {
            if (requestRef.current === controller) {
                requestRef.current = null;
                setAsking(false);
            }
        }
    }

    function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
        }
    }

    const missing = question.trim().length === 0;
    const showRequired = missing && !asking;

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
                <div className="ask-log" ref={logRef}>
                    {messages.map((message) => (
                        <ChatBubble key={message.id} message={message} />
                    ))}
                    {asking ? <ThinkingBubble /> : null}
                </div>
                <div className="ask-composer">
                    <div className={showRequired ? "ask-pill is-invalid" : "ask-pill"}>
                        <textarea
                            ref={fieldRef}
                            value={question}
                            maxLength={questionLimit}
                            rows={1}
                            placeholder={t("askPlaceholder")}
                            aria-label={t("askLabel")}
                            aria-invalid={showRequired}
                            disabled={asking}
                            onChange={(event) => setQuestion(event.target.value)}
                            onKeyDown={onKeyDown}
                        />
                        <button type="submit" className="ask-send" disabled={asking || missing} aria-label={t("askSend")}>
                            <Icon paths={iconPaths.send} />
                        </button>
                    </div>
                    <span className="ask-foot">
                        {showRequired ? (
                            <span className="field-required">{t("requiredField")}</span>
                        ) : !missing ? (
                            <span className="ask-count">{question.length} / {questionLimit}</span>
                        ) : null}
                    </span>
                </div>
            </form>
        </div>
    );
}

function ChatBubble({ message }: { message: ChatMessage }) {
    const own = message.role === "user";

    return (
        <article className={own ? "ask-message is-own" : "ask-message"}>
            <div className="ask-sender">{own ? t("askYou") : t("askAi")}</div>
            <div className="ask-row">
                <span className="ask-avatar" aria-hidden="true">
                    <Icon paths={own ? iconPaths.user : iconPaths.robot} />
                </span>
                <div className="ask-bubble-line">
                    <span className="ask-tail" aria-hidden="true" />
                    <div className="ask-bubble">
                        <p>{message.text}</p>
                        <time dateTime={message.at}>{formatTime(message.at)}</time>
                    </div>
                </div>
            </div>
        </article>
    );
}

function ThinkingBubble() {
    return (
        <article className="ask-message" aria-busy="true">
            <div className="ask-sender">{t("askAi")}</div>
            <div className="ask-row">
                <span className="ask-avatar" aria-hidden="true">
                    <Icon paths={iconPaths.robot} />
                </span>
                <div className="ask-bubble-line">
                    <span className="ask-tail" aria-hidden="true" />
                    <div className="ask-bubble is-thinking">
                        <p className="ask-thinking" role="status">
                            {t("asking")}
                            <span className="ask-thinking-dots" aria-hidden="true">
                                <span />
                                <span />
                                <span />
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
