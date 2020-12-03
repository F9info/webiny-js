import { ContextPlugin } from "@webiny/handler/types";
import defaults from "./defaults";
import getPKPrefix from "./utils/getPKPrefix";
import { PbContext } from "@webiny/api-page-builder/types";

export type Menu = {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

const TYPE = "pb.category";

const plugin: ContextPlugin<PbContext> = {
    type: "context",
    apply(context) {
        const { db } = context;
        const PK_MENU = () => `${getPKPrefix(context)}M`;

        context.menus = {
            async get(slug: string) {
                const [[menu]] = await db.read<Menu>({
                    ...defaults.db,
                    query: { PK: PK_MENU(), SK: slug },
                    limit: 1
                });

                return menu;
            },
            async list(args) {
                const [menus] = await db.read<Menu>({
                    ...defaults.db,
                    query: { PK: PK_MENU(), SK: { $gt: " " } },
                    ...args
                });

                return menus;
            },
            async create(data) {
                const { title, slug, description, items, createdBy, createdOn } = data;

                return db.create({
                    ...defaults.db,
                    data: {
                        PK: PK_MENU(),
                        SK: slug,
                        TYPE,
                        title,
                        slug,
                        description,
                        items,
                        createdOn,
                        createdBy
                    }
                });
            },
            update(data) {
                const { title, slug, description, items } = data;
                return db.update({
                    ...defaults.db,
                    query: { PK: PK_MENU(), SK: slug },
                    data: {
                        title,
                        slug,
                        description,
                        items
                    }
                });
            },
            delete(slug: string) {
                return db.delete({
                    ...defaults.db,
                    query: { PK: PK_MENU(), SK: slug }
                });
            }
        };
    }
};

export default plugin;
