import { withFields, string, fields } from "@webiny/commodo";

export default [
    {
        name: "pb-page-settings-social",
        type: "pb-page-settings-model",
        apply({ fields: settingsFields, context }) {
            settingsFields.social = fields({
                value: {},
                instanceOf: withFields({
                    meta: fields({
                        value: [],
                        list: true,
                        instanceOf: withFields({
                            property: string(),
                            content: string()
                        })()
                    }),
                    title: string(),
                    description: string(),
                    image: context.commodo.fields.id()
                })()
            });
        }
    },
    {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type PbOpenGraphTag {
                    property: String
                    content: String
                }

                input PbOpenGraphTagInput {
                    property: String!
                    content: String!
                }

                type PbSocialSettings {
                    title: String
                    description: String
                    meta: [PbOpenGraphTag]
                    image: File
                }

                input PbSocialSettingsInput {
                    title: String
                    description: String
                    meta: [PbOpenGraphTagInput!]
                    image: RefInput
                }

                extend type PbPageSettings {
                    social: PbSocialSettings
                }

                extend input PbPageSettingsInput {
                    social: PbSocialSettingsInput
                }
            `
        }
    }
];
