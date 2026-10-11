import { useEffect } from "react";
import { t } from "./i18n";

export default function App() {
  useEffect(() => {
    document.title = t("title");
    document.documentElement.lang = navigator.language;
  }, []);

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("environmentReady")}</p>
    </main>
  );
}
