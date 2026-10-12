import { locale } from "../i18n";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

export async function askOrders(question: string, signal?: AbortSignal): Promise<string> {
    const response = await fetch("/api/orders/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale: locale() }),
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
