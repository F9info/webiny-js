import merge from "lodash.merge";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

const emptyResolver = () => ({});
import group from "./graphql/Group";
import install from "./graphql/Install";
import user from "./graphql/User";

export default (): GraphQLSchemaPlugin => ({
    type: "graphql-schema",
    name: "graphql-schema-security",
    schema: {
        typeDefs: /* GraphQL */ `
            type SecurityQuery {
                _empty: String
            }

            type SecurityMutation {
                _empty: String
            }

            extend type Query {
                security: SecurityQuery
            }

            extend type Mutation {
                security: SecurityMutation
            }

            type SecurityError {
                code: String
                message: String
                data: JSON
            }

            type SecurityBooleanResponse {
                data: Boolean
                error: SecurityError
            }

            type SecurityCursors {
                next: String
                previous: String
            }

            type SecurityListMeta {
                cursors: SecurityCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            ${install.typeDefs}
            ${group.typeDefs}
            ${user.typeDefs}
        `,
        resolvers: merge(
            {
                Query: {
                    security: emptyResolver
                },
                Mutation: {
                    security: emptyResolver
                }
            },
            install.resolvers,
            group.resolvers,
            user.resolvers
        )
    }
});
