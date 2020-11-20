import { Response, ErrorResponse, NotFoundResponse } from "@webiny/handler-graphql/responses";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { NotAuthorizedResponse } from "@webiny/api-security";
import hasRwd from "./utils/hasRwd";

const resolver: GraphQLFieldResolver = async (root, args, context) => {
    try {
        // If permission has "rwd" property set, but "w" is not part of it, bail.
        const filesFilePermission = await context.security.getPermission("files.file");
        if (filesFilePermission && !hasRwd({ filesFilePermission, rwd: "w" })) {
            return new NotAuthorizedResponse();
        }

        const { files } = context;
        const { id, data } = args;

        let file = await files.get(id);

        if (!file) {
            return new NotFoundResponse(`File with id "${id}" does not exists.`);
        }

        // If user can only manage own records, let's check if he owns the loaded one.
        if (filesFilePermission?.own === true) {
            const identity = context.security.getIdentity();
            if (file.createdBy.id !== identity.id) {
                return new NotAuthorizedResponse();
            }
        }

        file = await files.update({ id, data, existingFile: file });

        // Index file in "Elastic Search"
        await context.elasticSearch.update({
            id,
            index: "file-manager",
            type: "_doc",
            body: {
                doc: data
            }
        });

        return new Response(file);
    } catch (e) {
        return new ErrorResponse({
            code: e.code,
            message: e.message,
            data: e.data
        });
    }
};

export default resolver;
