import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { t } from "../i18n";

type Theme = "light" | "dark";

const storageKey = "theme";

function readTheme(): Theme {
    localStorage.removeItem("balcao-theme");
    return localStorage.getItem(storageKey) === "light" ? "light" : "dark";
}

function SunIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z" />
            <path d="M19.14 19.14L19.01 19.01M19.01 4.99L19.14 4.86L19.01 4.99ZM4.86 19.14L4.99 19.01L4.86 19.14ZM12 2.08V2V2.08ZM12 22V21.92V22ZM2.08 12H2H2.08ZM22 12H21.92H22ZM4.99 4.99L4.86 4.86L4.99 4.99Z" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.03009 12.42C2.39009 17.57 6.76009 21.76 11.9901 21.99C15.6801 22.15 18.9801 20.43 20.9601 17.72C21.7801 16.61 21.3401 15.87 19.9701 16.12C19.3001 16.24 18.6101 16.29 17.8901 16.26C13.0001 16.06 9.00009 11.97 8.98009 7.13996C8.97009 5.83996 9.24009 4.60996 9.73009 3.48996C10.2701 2.24996 9.62009 1.65996 8.37009 2.18996C4.41009 3.85996 1.70009 7.84996 2.03009 12.42Z" />
        </svg>
    );
}

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>(readTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem(storageKey, theme);
    }, [theme]);

    const isDark = theme === "dark";

    function changeTheme(next: Theme, origin: HTMLButtonElement) {
        const rect = origin.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
        const root = document.documentElement;
        root.style.setProperty("--theme-x", `${x}px`);
        root.style.setProperty("--theme-y", `${y}px`);
        root.style.setProperty("--theme-r", `${Math.ceil(radius)}px`);

        const apply = () => {
            root.dataset.theme = next;
            localStorage.setItem(storageKey, next);
            flushSync(() => {
                setTheme(next);
            });
        };

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion || typeof document.startViewTransition !== "function") {
            apply();
            return;
        }

        try {
            document.startViewTransition(apply);
        } catch {
            apply();
        }
    }

    return (
        <button
            type="button"
            className={isDark ? "theme-toggle is-dark" : "theme-toggle"}
            aria-pressed={isDark}
            aria-label={isDark ? t("themeToDark") : t("themeToLight")}
            onClick={(event) => changeTheme(isDark ? "light" : "dark", event.currentTarget)}
        >
            <span className="theme-toggle-knob">
                {isDark ? <MoonIcon /> : <SunIcon />}
            </span>
            <span className="tip is-below" aria-hidden="true">{isDark ? t("themeToDark") : t("themeToLight")}</span>
        </button>
    );
}
