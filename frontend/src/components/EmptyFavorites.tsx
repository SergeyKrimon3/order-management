import { Icon, iconPaths } from "./Icon";
import { t } from "../i18n";

export function EmptyFavorites() {
    return (
        <section className="empty-favorites">
            <div className="empty-favorites-scene" aria-hidden="true">
                <Icon paths={iconPaths.heart} />
            </div>
            <p className="empty">{t("emptyFavorites")}</p>
        </section>
    );
}
