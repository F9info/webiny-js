import { createHandler } from "@webiny/handler-aws";
import apolloServerPlugins from "@webiny/handler-apollo-server";
import filesPlugins from "@webiny/api-file-manager/plugins";
import filesResolvers from "@webiny/api-plugin-files-resolvers-mongodb";
import securityPlugins from "@webiny/api-security/authenticator";
import dbPlugins from "@webiny/handler-db";
import { DynamoDbDriver } from "@webiny/db-dynamodb";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
// Graphql
import {
    CREATE_FILE,
    CREATE_FILES,
    UPDATE_FILE,
    DELETE_FILE,
    GET_FILE,
    LIST_FILES
} from "./graphql/file";
import {
    INSTALL,
    IS_INSTALLED,
    GET_SETTINGS,
    UPDATE_SETTINGS
} from "./graphql/fileManagerSettings";

export default ({ permissions, identity }) => {
    // Creates the actual handler. Feel free to add additional plugins if needed.
    const handler = createHandler(
        dbPlugins({
            table: "FileManager",
            driver: new DynamoDbDriver({
                documentClient: new DocumentClient({
                    convertEmptyValues: true,
                    endpoint: "localhost:8000",
                    sslEnabled: false,
                    region: "local-env"
                })
            })
        }),
        apolloServerPlugins(),
        securityPlugins(),
        {
            type: "security-authorization",
            getPermissions: () => permissions || [{ name: "*", key: "*" }]
        },
        {
            type: "security-authentication",
            authenticate() {
                return identity || null;
            }
        },
        filesPlugins(),
        filesResolvers()
    );

    // Let's also create the "invoke" function. This will make handler invocations in actual tests easier and nicer.
    const invoke = async ({ httpMethod = "POST", body, headers = {}, ...rest }) => {
        const response = await handler({
            httpMethod,
            headers,
            body: JSON.stringify(body),
            ...rest
        });

        // The first element is the response body, and the second is the raw response.
        return [JSON.parse(response.body), response];
    };

    return {
        handler,
        invoke,
        // Files
        async createFile(variables) {
            return invoke({ body: { query: CREATE_FILE, variables } });
        },
        async updateFile(variables) {
            return invoke({ body: { query: UPDATE_FILE, variables } });
        },
        async createFiles(variables) {
            return invoke({ body: { query: CREATE_FILES, variables } });
        },
        async deleteFile(variables) {
            return invoke({ body: { query: DELETE_FILE, variables } });
        },
        async getFile(variables) {
            return invoke({ body: { query: GET_FILE, variables } });
        },
        async listFiles(variables) {
            return invoke({ body: { query: LIST_FILES, variables } });
        },
        // File Manager settings
        async isInstalled(variables) {
            return invoke({ body: { query: IS_INSTALLED, variables } });
        },
        async install(variables) {
            return invoke({ body: { query: INSTALL, variables } });
        },
        async getSettings(variables) {
            return invoke({ body: { query: GET_SETTINGS, variables } });
        },
        async updateSettings(variables) {
            return invoke({ body: { query: UPDATE_SETTINGS, variables } });
        }
    };
};