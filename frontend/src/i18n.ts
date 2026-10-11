import en from "./locales/en.json" with { type: "json" };
import es from "./locales/es.json" with { type: "json" };
import ptBr from "./locales/pt-br.json" with { type: "json" };

export type MessageKey = keyof typeof ptBr;

const catalogs: Record<string, Record<MessageKey, string>> = {
  en,
  es,
  "pt-BR": ptBr,
};

function catalog(): Record<MessageKey, string> {
  const language = navigator.language.toLowerCase();
  if (language.startsWith("pt")) {
    return catalogs["pt-BR"];
  }

  if (language.startsWith("es")) {
    return catalogs.es;
  }

  return catalogs.en;
}

export function t(key: MessageKey): string {
  return catalog()[key];
}
