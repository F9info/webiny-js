import { ContextPlugin } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import { I18NContentContext } from "../types";

export default () =>
    ({
        type: "context",
        apply(context) {
            context.i18nContent = { locale: context.i18n.getCurrentLocale("content") };
        }
    } as ContextPlugin<I18NContext, I18NContentContext>);
