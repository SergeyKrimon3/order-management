const retryIntervalMs = 3000;

export function watchOrderEvents(onUpdate: () => void): () => void {
    let source: EventSource | null = null;
    let pollId: number | null = null;
    let retryId: number | null = null;
    let opened = false;
    let stopped = false;

    function stopPoll(): void {
        if (pollId === null) {
            return;
        }

        window.clearInterval(pollId);
        pollId = null;
    }

    function stopRetry(): void {
        if (retryId === null) {
            return;
        }

        window.clearTimeout(retryId);
        retryId = null;
    }

    function connect(): void {
        if (source !== null) {
            const previous = source;
            source = null;
            previous.close();
        }

        const next = new EventSource("/api/orders/events");
        source = next;

        next.onopen = () => {
            if (stopped || source !== next) {
                return;
            }

            const recovered = opened;
            opened = true;
            stopPoll();
            stopRetry();
            if (recovered) {
                onUpdate();
            }
        };

        next.onmessage = () => {
            if (!stopped && source === next) {
                onUpdate();
            }
        };

        next.onerror = () => {
            if (stopped || source !== next) {
                return;
            }

            // Some failures make the browser stop retrying this stream.
            source = null;
            next.close();
            if (pollId === null) {
                pollId = window.setInterval(() => {
                    if (!stopped) {
                        onUpdate();
                    }
                }, retryIntervalMs);
            }

            if (retryId !== null) {
                return;
            }

            retryId = window.setTimeout(() => {
                retryId = null;
                if (!stopped) {
                    connect();
                }
            }, retryIntervalMs);
        };
    }

    connect();

    return () => {
        stopped = true;
        stopPoll();
        stopRetry();
        if (source !== null) {
            const previous = source;
            source = null;
            previous.close();
        }
    };
}
