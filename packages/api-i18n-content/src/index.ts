import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import { I18NContentContext } from "./types";
import { Context } from "@webiny/handler/types";

export const hasI18NContentPermission = () => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context: Context<I18NContentContext>, info) => {
            const contentPermission = await context.security.getPermission("content.i18n");
            if (!contentPermission) {
                return new NotAuthorizedResponse();
            }

            const hasLocaleAccess =
                !Array.isArray(contentPermission.locales) ||
                contentPermission.locales.includes(context?.i18nContent?.locale?.code);
            if (!hasLocaleAccess) {
                return new NotAuthorizedResponse();
            }

            return resolver(parent, args, context, info);
        };
    };
};
