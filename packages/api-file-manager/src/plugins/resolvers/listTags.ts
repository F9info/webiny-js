import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse } from "@webiny/handler-graphql/responses";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        const response = await context.elasticSearch.search({
            index: "file-manager",
            body: {
                size: 0,
                aggs: {
                    listTags: {
                        terms: { field: "tags.keyword" }
                    }
                }
            }
        });

        return response?.body?.aggregations?.listTags?.buckets?.map(item => item.key) || [];
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
