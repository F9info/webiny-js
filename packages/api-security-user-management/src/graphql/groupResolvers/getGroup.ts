import { ErrorResponse, NotFoundResponse, Response } from "@webiny/handler-graphql/responses";

export default async (_, { id, slug }, context) => {
    const { groups } = context;
    try {
        if (id) {
            const group = await groups.get(id);

            if (!group) {
                return new NotFoundResponse(`Unable to find group with id: ${id}`);
            }
            return new Response(group);
        }

        if (slug) {
            const group = await groups.getBySlug(slug);

            if (!group) {
                return new NotFoundResponse(`Unable to find group with slug: ${slug}`);
            }
            return new Response(group);
        }
    } catch (e) {
        return new ErrorResponse({
            message: e.message,
            code: e.code,
            data: e.data || null
        });
    }
};
