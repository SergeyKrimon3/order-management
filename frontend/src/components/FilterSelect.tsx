import { useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";
import { useAnchoredPanel } from "./anchoredPanel";
import { Icon, iconPaths } from "./Icon";

interface FilterOption {
    value: string;
    label: string;
}

interface FilterSelectProps {
    value: string;
    options: readonly FilterOption[];
    ariaLabel: string;
    onChange: (value: string) => void;
    onClear: () => void;
}

export function FilterSelect({ value, options, ariaLabel, onChange, onClear }: FilterSelectProps) {
    const [open, setOpen] = useState(false);
    const { anchorRef, panelRef, position } = useAnchoredPanel(open, () => setOpen(false), 160);
    const selected = options.find((option) => option.value === value) ?? null;

    function choose(next: string) {
        onChange(next);
        setOpen(false);
    }

    return (
        <div className="filter-field" ref={anchorRef}>
            <button
                type="button"
                className={value.length > 0 ? "order-search filter-trigger has-clear" : "order-search filter-trigger"}
                aria-label={ariaLabel}
                aria-expanded={open}
                aria-haspopup="listbox"
                onClick={() => setOpen((current) => !current)}
            >
                <span className={selected ? undefined : "is-placeholder"}>{selected ? selected.label : t("selectOption")}</span>
            </button>
            {value.length > 0 ? (
                <button
                    type="button"
                    className="filter-clear"
                    aria-label={t("clearFilter")}
                    onClick={() => {
                        onClear();
                        setOpen(false);
                    }}
                >
                    <Icon paths={iconPaths.closeCircle} />
                </button>
            ) : (
                <span className={open ? "filter-chevron is-open" : "filter-chevron"} aria-hidden="true" />
            )}
            {open && position
                ? createPortal(
                    <div
                        ref={panelRef}
                        className="filter-popover filter-menu"
                        role="listbox"
                        style={{ top: position.top, left: position.left, width: position.width }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                className={option.value === value ? "is-selected" : undefined}
                                onClick={() => choose(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
}
