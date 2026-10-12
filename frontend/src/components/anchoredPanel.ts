import { useEffect, useRef, useState } from "react";

interface PanelPosition {
    top: number;
    left: number;
    width: number;
}

export function useAnchoredPanel(open: boolean, onClose: () => void, minWidth: number) {
    const anchorRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const [position, setPosition] = useState<PanelPosition | null>(null);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        function place() {
            const anchor = anchorRef.current;
            if (!anchor) {
                return;
            }

            const rect = anchor.getBoundingClientRect();
            const margin = 8;
            const width = Math.max(rect.width, minWidth);
            let left = rect.left;
            if (left + width > window.innerWidth - margin) {
                left = Math.max(margin, window.innerWidth - margin - width);
            }

            let top = rect.bottom + 6;
            const panelHeight = panelRef.current?.offsetHeight ?? 0;
            if (panelHeight > 0 && top + panelHeight > window.innerHeight - margin) {
                top = Math.max(margin, rect.top - 6 - panelHeight);
            }

            setPosition((current) => {
                if (current && current.top === top && current.left === left && current.width === width) {
                    return current;
                }

                return { top, left, width };
            });
        }

        place();
        const frame = window.requestAnimationFrame(place);
        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
        };
    }, [open, minWidth]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent) {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }

            if (anchorRef.current?.contains(target) || panelRef.current?.contains(target)) {
                return;
            }

            onCloseRef.current();
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onCloseRef.current();
            }
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return { anchorRef, panelRef, position };
}
