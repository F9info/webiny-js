import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse } from "@webiny/handler-graphql/responses";
import { FileManagerResolverContext } from "../../types";
import defaults from "../crud/defaults";

const resolver: GraphQLFieldResolver = async (root, args, context: FileManagerResolverContext) => {
    try {
        const { i18nContent, security } = context;
        const esDefaults = defaults.es(security.getTenant());

        const response = await context.elasticSearch.search({
            ...esDefaults,
            body: {
                query: {
                    term: { "locale.keyword": i18nContent.locale.code }
                },
                size: 0,
                aggs: {
                    listTags: {
                        terms: { field: "tags.keyword" }
                    }
                }
            }
        });

        return response.body.aggregations.listTags.buckets.map(item => item.key);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
