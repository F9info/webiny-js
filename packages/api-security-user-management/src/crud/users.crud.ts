// TODO remove
// @ts-nocheck
import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import pipe from "@ramda/pipe";
import { validation } from "@webiny/validation";
import { withFields, string, setOnce, onSet, skipOnPopulate } from "@commodo/fields";
import { object } from "commodo-fields-object";

export const getJSON = instance => {
    const output = {};
    const fields = Object.keys(instance.getFields());
    for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        output[field] = instance[field];
    }
    return output;
};

// A simple data model
const UserDataModel = pipe(
    withFields(dataInstance => ({
        id: pipe(setOnce())(string({ validation: validation.create("required") })),
        createdOn: pipe(skipOnPopulate(), setOnce())(string({ value: new Date().toISOString() })),
        savedOn: pipe(skipOnPopulate())(string({ value: new Date().toISOString() })),
        createdBy: object(),
        // User data
        email: onSet(value => {
            if (value === dataInstance.email) {
                return value;
            }
            value = value.toLowerCase().trim();
            return value;
        })(
            string({
                validation: validation.create("required")
            })
        ),
        firstName: string(),
        lastName: string(),
        group: string(),
        avatar: object(),
        personalAccessTokens: skipOnPopulate()(
            string({
                list: true,
                value: []
            })
        )
    }))
)();

const keys = [
    { primary: true, unique: true, name: "primary", fields: [{ name: "PK" }, { name: "SK" }] },
    { unique: true, name: "GSI1", fields: [{ name: "GSI1_PK" }, { name: "GSI1_SK" }] }
];

export const PK_USER = "U";
export const SK_USER = "A";
export const GSI1_PK_USER = "USER";

export type User = {
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: Record<string, any>;
    email: string;
    firstName: string;
    lastName: string;
    group: Record<string, any>;
    avatar: Record<string, any>;
    personalAccessTokens: string[];
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.users = {
            async get(id: string) {
                const [[user]] = await db.read<User>({
                    keys,
                    query: { PK: `${PK_USER}#${id}`, SK: SK_USER },
                    limit: 1
                });

                return user?.data;
            },
            async getByLogin(login: string) {
                const [[user]] = await db.read<User>({
                    keys,
                    query: { GSI1_PK: GSI1_PK_USER, GSI1_SK: `login#${login}` },
                    limit: 1
                });

                return user?.GSI_DATA;
            },
            async list(args) {
                const [users] = await db.read<User>({
                    keys,
                    query: { GSI1_PK: GSI1_PK_USER, GSI1_SK: { $beginsWith: "createdOn" } },
                    ...args
                });

                return users.map(user => user.GSI_DATA);
            },
            async create(data) {
                const identity = context.security.getIdentity();

                // Don't allow creating user with same "email".
                const existingUser = await this.getByLogin(data.email);
                if (existingUser) {
                    throw {
                        message: "User with given e-mail already exists.",
                        code: "USER_EXISTS"
                    };
                }

                // Use `WithFields` model for data validation and setting default value.
                const user = new UserDataModel().populate(data);
                user.id = data.id;
                await user.validate();
                // Add "createdBy"
                user.createdBy = {
                    id: identity?.id,
                    displayName: identity?.displayName,
                    type: identity?.type
                };

                const batch = db.batch();

                batch.create(
                    {
                        data: {
                            PK: `${PK_USER}#${user.id}`,
                            SK: SK_USER,
                            GSI1_PK: GSI1_PK_USER,
                            GSI1_SK: `login#${user.email}`,
                            data: getJSON(user),
                            GSI_DATA: getJSON(user)
                        }
                    },
                    {
                        data: {
                            PK: `${PK_USER}#${user.id}`,
                            SK: "createdOn",
                            GSI1_PK: GSI1_PK_USER,
                            GSI1_SK: `createdOn#${user.createdOn}`,
                            data: getJSON(user),
                            GSI_DATA: getJSON(user)
                        }
                    }
                );

                await batch.execute();

                return user;
            },
            async update({ id, data, existingUserData }) {
                // Only update incoming props
                const propsToUpdate = Object.keys(data);
                propsToUpdate.forEach(key => {
                    existingUserData[key] = data[key];
                });

                // Don't allow updating user with existing "email".
                if (data.email) {
                    const existingUser = await this.getByLogin(data.email);
                    if (existingUser) {
                        throw {
                            message: "User with given e-mail already exists.",
                            code: "USER_EXISTS"
                        };
                    }
                }

                // Use `WithFields` model for data validation and setting default value.
                const user = new UserDataModel().populate(existingUserData);
                await user.validate();
                // Update meta data
                user.savedOn = new Date().toISOString();

                const batch = db.batch();

                batch.update(
                    {
                        keys,
                        query: { PK: `${PK_USER}#${id}`, SK: SK_USER },
                        data: {
                            PK: `${PK_USER}#${user.id}`,
                            SK: SK_USER,
                            GSI1_PK: GSI1_PK_USER,
                            GSI1_SK: `login#${user.email}`,
                            data: getJSON(user),
                            GSI_DATA: getJSON(user)
                        }
                    },
                    {
                        keys,
                        query: { PK: `${PK_USER}#${id}`, SK: SK_USER },
                        data: {
                            PK: `${PK_USER}#${user.id}`,
                            SK: "createdOn",
                            GSI1_PK: GSI1_PK_USER,
                            GSI1_SK: `createdOn#${user.createdOn}`,
                            data: getJSON(user),
                            GSI_DATA: getJSON(user)
                        }
                    }
                );

                await batch.execute();

                return user;
            },
            delete(id: string) {
                const batch = db.batch();

                const fields = ["A", "createdOn"];

                batch.delete(
                    ...fields.map(field => ({
                        keys,
                        query: {
                            PK: `${PK_USER}#${id}`,
                            SK: field
                        }
                    }))
                );

                return batch.execute();
            }
        };
    }
} as ContextPlugin<DbContext>;
