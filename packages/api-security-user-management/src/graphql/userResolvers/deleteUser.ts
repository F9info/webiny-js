import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ErrorResponse, Response, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { SecurityUserManagementPlugin } from "@webiny/api-security-user-management/types";
import { Context } from "@webiny/handler/types";

const resolver: GraphQLFieldResolver = async (root, args, context: Context) => {
    const { id } = args;
    const { users } = context;

    try {
        const user = await users.get(id);

        if (!user) {
            return new NotFoundResponse(id ? `User "${id}" not found!` : "User not found!");
        }

        await users.delete(id);

        const authPlugin = context.plugins.byName<SecurityUserManagementPlugin>(
            "security-user-management"
        );

        await authPlugin.deleteUser({ user: user.data }, context);

        return new Response(true);
    } catch (e) {
        return new ErrorResponse(e);
    }
};

export default resolver;
