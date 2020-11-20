import { NotFoundResponse, Response, ErrorResponse } from "@webiny/handler-graphql/responses";

export default async (_, { id, data }, context) => {
    const { groups } = context;

    try {
        const existingGroupData = await groups.get(id);

        if (!existingGroupData) {
            return new NotFoundResponse(`Group with id: ${id} not found!`);
        }

        const updatedGroupData = await groups.update({
            id,
            data,
            existingGroupData
        });

        return new Response(updatedGroupData);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data || null
        });
    }
};
