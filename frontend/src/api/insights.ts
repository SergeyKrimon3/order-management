import { locale } from "../i18n";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export interface AskHistoryTurn {
    role: "user" | "assistant";
    text: string;
}

export async function askOrders(
    question: string,
    history: readonly AskHistoryTurn[],
    signal?: AbortSignal,
): Promise<string> {
    const response = await fetch("/api/orders/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale: locale(), history: history.slice(-20) }),
        signal,
    });
    if (!response.ok) {
        throw new Error("Ask failed.");
    }

    const body: unknown = await response.json();
    if (!isRecord(body) || typeof body.answer !== "string" || body.answer.length === 0) {
        throw new Error("Invalid answer.");
    }

    return body.answer;
}
