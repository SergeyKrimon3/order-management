import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";
import { useAnchoredPanel } from "./anchoredPanel";
import { Icon, iconPaths } from "./Icon";

interface FilterCalendarProps {
    start: string;
    end: string;
    ariaLabel: string;
    onChange: (start: string, end: string) => void;
    onClear: () => void;
}

interface CalendarCell {
    iso: string;
    day: number;
    inMonth: boolean;
}

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

function toIso(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromIso(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
        return null;
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function rangeLabel(start: string, end: string): string {
    if (start.length === 0) {
        return t("selectOption");
    }

    if (end.length === 0 || start === end) {
        return formatFilterDay(start);
    }

    return `${formatFilterDay(start)} – ${formatFilterDay(end)}`;
}

function ordered(left: string, right: string): { from: string; to: string } {
    return left <= right ? { from: left, to: right } : { from: right, to: left };
}

function formatFilterDay(value: string): string {
    const date = fromIso(value);
    if (!date) {
        return value;
    }

    return new Intl.DateTimeFormat(navigator.language, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

type CalendarPicker = "days" | "months" | "years";

function monthName(view: Date): string {
    const label = new Intl.DateTimeFormat(navigator.language, { month: "long" }).format(view);
    return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortMonths(): string[] {
    return Array.from({ length: 12 }, (_, index) => {
        const raw = new Intl.DateTimeFormat(navigator.language, { month: "short" }).format(new Date(2023, index, 1));
        const label = raw.replace(".", "");
        return label.charAt(0).toUpperCase() + label.slice(1);
    });
}

function weekDays(): string[] {
    const sunday = new Date(2023, 0, 1);
    return Array.from({ length: 7 }, (_, index) => {
        const day = new Date(sunday);
        day.setDate(sunday.getDate() + index);
        return new Intl.DateTimeFormat(navigator.language, { weekday: "narrow" }).format(day).toUpperCase();
    });
}

function monthCells(view: Date): CalendarCell[] {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const cells: CalendarCell[] = [];

    for (let index = 0; index < first.getDay(); index += 1) {
        const date = new Date(year, month, 1 - (first.getDay() - index));
        cells.push({ iso: toIso(date), day: date.getDate(), inMonth: false });
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
        const date = new Date(year, month, day);
        cells.push({ iso: toIso(date), day, inMonth: true });
    }

    const trailing = 42 - cells.length;
    for (let day = 1; day <= trailing; day += 1) {
        const date = new Date(year, month + 1, day);
        cells.push({ iso: toIso(date), day: date.getDate(), inMonth: false });
    }

    return cells;
}

export function FilterCalendar({ start, end, ariaLabel, onChange, onClear }: FilterCalendarProps) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState(() => fromIso(start) ?? new Date());
    const [draftStart, setDraftStart] = useState(start);
    const [draftEnd, setDraftEnd] = useState(end);
    const [hoverIso, setHoverIso] = useState<string | null>(null);
    const [picker, setPicker] = useState<CalendarPicker>("days");
    const [yearAnchor, setYearAnchor] = useState(() => new Date().getFullYear());
    const { anchorRef, panelRef, position } = useAnchoredPanel(open, () => {
        setPicker("days");
        setOpen(false);
    }, 280);
    const days = weekDays();
    const months = shortMonths();
    const years = Array.from({ length: 12 }, (_, index) => yearAnchor - 5 + index);
    const cells = useMemo(() => monthCells(view), [view]);
    const pickingEnd = draftStart.length > 0 && draftEnd.length === 0;
    const preview = draftStart.length === 0
        ? null
        : ordered(draftStart, pickingEnd ? (hoverIso ?? draftStart) : draftEnd);
    const hasRange = start.length > 0 && end.length > 0;

    function toggle() {
        setDraftStart(start);
        setDraftEnd(end);
        setHoverIso(null);
        setPicker("days");
        setView(fromIso(start) ?? new Date());
        setOpen((current) => !current);
    }

    function shift(direction: -1 | 1) {
        if (picker === "years") {
            setYearAnchor((current) => current + direction * 12);
            return;
        }

        if (picker === "months") {
            setView(new Date(view.getFullYear() + direction, view.getMonth(), 1));
            return;
        }

        setView(new Date(view.getFullYear(), view.getMonth() + direction, 1));
    }

    function openYears() {
        setYearAnchor(view.getFullYear());
        setPicker("years");
    }

    function choose(iso: string) {
        if (!pickingEnd) {
            setDraftStart(iso);
            setDraftEnd("");
            setHoverIso(null);
            return;
        }

        const next = ordered(draftStart, iso);
        setDraftStart(next.from);
        setDraftEnd(next.to);
        onChange(next.from, next.to);
        setOpen(false);
    }

    function slotClass(iso: string): string {
        if (!preview || iso < preview.from || iso > preview.to) {
            return "cal-slot";
        }

        if (preview.from === preview.to) {
            return "cal-slot";
        }

        if (iso === preview.from) {
            return "cal-slot is-range-start";
        }

        if (iso === preview.to) {
            return "cal-slot is-range-end";
        }

        return "cal-slot is-in-range";
    }

    function dayClass(iso: string, inMonth: boolean): string {
        const classes = ["cal-day"];
        if (!inMonth) {
            classes.push("is-outside");
        }

        if (!preview || iso < preview.from || iso > preview.to) {
            return classes.join(" ");
        }

        if (iso === preview.from && iso === preview.to) {
            classes.push("is-selected");
        } else if (iso === preview.from) {
            classes.push("is-range-start");
        } else if (iso === preview.to) {
            classes.push("is-range-end");
        } else {
            classes.push("is-in-range");
        }

        return classes.join(" ");
    }

    return (
        <div className="filter-field" ref={anchorRef}>
            <button
                type="button"
                className={hasRange ? "order-search filter-trigger has-prefix has-clear" : "order-search filter-trigger has-prefix"}
                aria-label={ariaLabel}
                aria-expanded={open}
                onClick={toggle}
            >
                <span className="filter-prefix filter-calendar-icon" aria-hidden="true">
                    <Icon paths={iconPaths.calendar} />
                </span>
                <span className={hasRange ? "filter-value" : "filter-value is-placeholder"}>
                    {hasRange ? rangeLabel(start, end) : t("selectOption")}
                </span>
            </button>
            {hasRange ? (
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
            ) : null}
            {open && position
                ? createPortal(
                    <div
                        ref={panelRef}
                        className="filter-popover filter-calendar"
                        style={{ top: position.top, left: position.left }}
                    >
                        <div className="cal-header">
                            <button type="button" className="cal-nav is-prev" aria-label={picker === "days" ? t("previousMonth") : t("previousYear")} onClick={() => shift(-1)}>
                                <Icon paths={iconPaths.arrowRight} />
                            </button>
                            {picker === "years" ? (
                                <span className="cal-title">{years[0]} – {years[years.length - 1]}</span>
                            ) : (
                                <span className="cal-title">
                                    {picker === "days" ? (
                                        <button type="button" aria-label={t("chooseMonth")} onClick={() => setPicker("months")}>
                                            {monthName(view)}
                                        </button>
                                    ) : null}
                                    <button type="button" className={picker === "months" ? "is-open" : undefined} aria-label={t("chooseYear")} onClick={openYears}>
                                        {view.getFullYear()}
                                    </button>
                                </span>
                            )}
                            <button type="button" className="cal-nav" aria-label={picker === "days" ? t("nextMonth") : t("nextYear")} onClick={() => shift(1)}>
                                <Icon paths={iconPaths.arrowRight} />
                            </button>
                        </div>
                        {picker === "months" ? (
                            <div className="cal-grid is-months">
                                {months.map((label, index) => (
                                    <button
                                        key={`${label}-${index}`}
                                        type="button"
                                        className={index === view.getMonth() ? "cal-choice is-selected" : "cal-choice"}
                                        onClick={() => {
                                            setView(new Date(view.getFullYear(), index, 1));
                                            setPicker("days");
                                        }}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        {picker === "years" ? (
                            <div className="cal-grid is-years">
                                {years.map((year) => (
                                    <button
                                        key={year}
                                        type="button"
                                        className={year === view.getFullYear() ? "cal-choice is-selected" : "cal-choice"}
                                        onClick={() => {
                                            setView(new Date(year, view.getMonth(), 1));
                                            setPicker("months");
                                        }}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        {picker === "days" ? (
                        <div className="cal-grid">
                            {days.map((day, index) => (
                                <span key={`${day}-${index}`} className="cal-head">{day}</span>
                            ))}
                            {cells.map((cell) => (
                                <span key={`${cell.inMonth ? "in" : "out"}-${cell.iso}`} className={slotClass(cell.iso)}>
                                    <button
                                        type="button"
                                        className={dayClass(cell.iso, cell.inMonth)}
                                        onMouseEnter={() => {
                                            if (pickingEnd) {
                                                setHoverIso(cell.iso);
                                            }
                                        }}
                                        onClick={() => choose(cell.iso)}
                                    >
                                        {cell.day}
                                    </button>
                                </span>
                            ))}
                        </div>
                        ) : null}
                    </div>,
                    document.body,
                )
                : null}
        </div>
    );
}
