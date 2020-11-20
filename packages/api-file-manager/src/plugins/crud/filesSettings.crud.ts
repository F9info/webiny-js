import { ContextPlugin } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { withFields, string, boolean, number, setOnce, onSet } from "@commodo/fields";
import { validation } from "@webiny/validation";
import { getJSON } from "./files.crud";
import dbArgs from "./dbArgs";

export const SETTINGS_KEY = "file-manager";
// A simple data model
const FilesSettings = withFields({
    key: setOnce()(string({ value: SETTINGS_KEY })),
    installed: boolean({ value: false }),
    uploadMinFileSize: number({
        value: 0,
        validation: validation.create("required,gte:0")
    }),
    uploadMaxFileSize: number({
        value: 26214401,
        validation: validation.create("required")
    }),
    srcPrefix: onSet(value => {
        // Make sure srcPrefix always ends with forward slash.
        if (typeof value === "string") {
            return value.endsWith("/") ? value : value + "/";
        }
        return value;
    })(
        string({
            validation: validation.create("required"),
            value: "/files/"
        })
    )
})();

export const PK_FILE_SETTINGS = "S";

export type FileSettings = {
    key: string;
    installed: boolean;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
};

export default {
    type: "context",
    apply(context) {
        const { db } = context;
        context.filesSettings = {
            async get(key: string) {
                const [[settings]] = await db.read<FileSettings>({
                    ...dbArgs,
                    query: { PK: PK_FILE_SETTINGS, SK: key },
                    limit: 1
                });

                return settings;
            },
            async list(args) {
                const [settingsList] = await db.read<FileSettings>({
                    ...dbArgs,
                    query: { PK: PK_FILE_SETTINGS, SK: { $gt: " " } },
                    ...args
                });

                return settingsList;
            },
            async create(data) {
                // Use `WithFields` model for data validation and setting default value.
                const filesSettings = new FilesSettings().populate(data);
                await filesSettings.validate();

                await db.create({
                    data: {
                        PK: PK_FILE_SETTINGS,
                        SK: filesSettings.key,
                        ...getJSON(filesSettings)
                    }
                });

                return filesSettings;
            },
            async update({ data, existingSettings }) {
                // Only update incoming props
                const propsToUpdate = Object.keys(data);
                propsToUpdate.forEach(key => {
                    existingSettings[key] = data[key];
                });

                // Use `WithFields` model for data validation and setting default value.
                const filesSettings = new FilesSettings().populate(existingSettings);
                await filesSettings.validate();

                await db.update({
                    ...dbArgs,
                    query: { PK: PK_FILE_SETTINGS, SK: filesSettings.key },
                    data: getJSON(filesSettings)
                });

                return filesSettings;
            },
            delete(key: string) {
                return db.delete({
                    ...dbArgs,
                    query: { PK: PK_FILE_SETTINGS, SK: key }
                });
            }
        };
    }
} as ContextPlugin<DbContext>;
