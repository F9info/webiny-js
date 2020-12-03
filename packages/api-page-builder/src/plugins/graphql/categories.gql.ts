import { hasPermission, NotAuthorizedResponse } from "@webiny/api-security";
import { hasI18NContentPermission } from "@webiny/api-i18n-content";
import { Response, NotFoundResponse, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { compose } from "@webiny/handler-graphql";
import { PbContext } from "@webiny/api-page-builder/types";

const hasRwd = ({ pbCategoryPermission, rwd }) => {
    if (typeof pbCategoryPermission.rwd !== "string") {
        return true;
    }

    return pbCategoryPermission.rwd.includes(rwd);
};

const plugin: GraphQLSchemaPlugin<PbContext> = {
    type: "graphql-schema",
    schema: {
        typeDefs: /* GraphQL */ `
            type PbCategory {
                id: ID
                createdOn: DateTime
                createdBy: PbCreatedBy
                name: String
                slug: String
                url: String
                layout: JSON
            }

            input PbCategoryInput {
                id: ID
                name: String
                slug: String
                url: String
                layout: JSON
            }

            # Response types
            type PbCategoryResponse {
                data: PbCategory
                error: PbError
            }

            type PbCategoryListResponse {
                data: [PbCategory]
                error: PbError
            }

            extend type PbQuery {
                getCategory(slug: String!): PbCategoryResponse
                listCategories: PbCategoryListResponse

                "Returns category by given slug."
                getCategoryBySlug(slug: String!): PbCategoryResponse
            }

            extend type PbMutation {
                createCategory(data: PbCategoryInput!): PbCategoryResponse
                updateCategory(slug: String!, data: PbCategoryInput!): PbCategoryResponse
                deleteCategory(slug: String!): PbCategoryResponse
            }
        `,
        resolvers: {
            PbQuery: {
                getCategory: compose(
                    hasPermission("pb.category"),
                    hasI18NContentPermission()
                )(async (_, args: { slug: string }, context: PbContext) => {
                    // If permission has "rwd" property set, but "r" is not part of it, bail.
                    const pbCategoryPermission = await context.security.getPermission(
                        "pb.category"
                    );

                    if (pbCategoryPermission && !hasRwd({ pbCategoryPermission, rwd: "r" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { categories } = context;
                    const category = await categories.get(args.slug);
                    if (!category) {
                        return new NotFoundResponse(`Category "${args.slug}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbCategoryPermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (category.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    return new Response(category);
                }),
                listCategories: async (_, args, context) => {
                    const { categories } = context;
                    try {
                        const list = await categories.list();
                        return new Response(list);
                    } catch (e) {
                        return new ErrorResponse(e);
                    }
                }
            },
            PbMutation: {
                createCategory: compose(
                    hasPermission("pb.category"),
                    hasI18NContentPermission()
                )(async (_, args, context: PbContext) => {
                    // If permission has "rwd" property set, but "w" is not part of it, bail.
                    const pbCategoryPermission = await context.security.getPermission(
                        "pb.category"
                    );
                    if (pbCategoryPermission && !hasRwd({ pbCategoryPermission, rwd: "w" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { categories } = context;
                    const { data } = args;

                    if (await categories.get(data.slug)) {
                        return new NotFoundResponse(
                            `Category with slug "${data.slug}" already exists.`
                        );
                    }

                    const identity = context.security.getIdentity();

                    const newData = {
                        ...data,
                        createdOn: new Date().toISOString(),
                        createdBy: {
                            id: identity.id,
                            displayName: identity.displayName
                        }
                    };

                    await categories.create(newData);

                    return new Response(newData);
                }),
                updateCategory: compose(
                    hasPermission("pb.category"),
                    hasI18NContentPermission()
                )(
                    async (
                        _,
                        args: { slug: string; data: Record<string, any> },
                        context: PbContext
                    ) => {
                        // If permission has "rwd" property set, but "w" is not part of it, bail.
                        const pbCategoryPermission = await context.security.getPermission(
                            "pb.category"
                        );
                        if (pbCategoryPermission && !hasRwd({ pbCategoryPermission, rwd: "w" })) {
                            return new NotAuthorizedResponse();
                        }

                        const { categories } = context;
                        const { slug, data } = args;

                        const category = await categories.get(slug);
                        if (!category) {
                            return new NotFoundResponse(`Category "${slug}" not found.`);
                        }

                        // If user can only manage own records, let's check if he owns the loaded one.
                        if (pbCategoryPermission?.own === true) {
                            const identity = context.security.getIdentity();
                            if (category.createdBy.id !== identity.id) {
                                return new NotAuthorizedResponse();
                            }
                        }

                        const changed = await categories.update(slug, data);

                        return new Response({ ...category, ...changed });
                    }
                ),
                deleteCategory: compose<any, { slug: string }, PbContext>(
                    hasPermission("pb.category"),
                    hasI18NContentPermission()
                )(async (_, args, context) => {
                    // If permission has "rwd" property set, but "d" is not part of it, bail.
                    const pbCategoryPermission = await context.security.getPermission(
                        "pb.category"
                    );
                    if (pbCategoryPermission && !hasRwd({ pbCategoryPermission, rwd: "d" })) {
                        return new NotAuthorizedResponse();
                    }

                    const { categories } = context;
                    const { slug } = args;

                    const category = await categories.get(slug);
                    if (!category) {
                        return new NotFoundResponse(`Category "${args.slug}" not found.`);
                    }

                    // If user can only manage own records, let's check if he owns the loaded one.
                    if (pbCategoryPermission?.own === true) {
                        const identity = context.security.getIdentity();
                        if (category.createdBy.id !== identity.id) {
                            return new NotAuthorizedResponse();
                        }
                    }

                    await categories.delete(slug);

                    return new Response(category);
                })
            }
        }
    }
};

export default plugin;
