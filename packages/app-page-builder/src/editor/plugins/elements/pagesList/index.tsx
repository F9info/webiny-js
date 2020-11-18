import React from "react";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/types";
import { Tab } from "@webiny/ui/Tabs";
import DesignIcon from "./icons/round-style-24px.svg";
import FilterIcon from "./icons/round-filter_list-24px.svg";
import PageListIcon from "./page-list-icon.svg";
import PagesList from "./PagesList";
import PagesListFilterSettings from "./PagesListFilterSettings";
import PagesListDesignSettings from "./PagesListDesignSettings";
import styled from "@emotion/styled";
import { PluginCollection } from "@webiny/plugins/types";

export default (): PluginCollection => {
    const PreviewBox = styled("div")({
        textAlign: "center",
        margin: "0 auto",
        width: 100,
        svg: {
            width: 100
        }
    });

    return [
        {
            name: "pb-editor-page-element-pages-list",
            type: "pb-editor-page-element",
            elementType: "pages-list",
            toolbar: {
                title: "List of pages",
                group: "pb-editor-element-group-basic",
                preview() {
                    return (
                        <PreviewBox>
                            <PageListIcon />
                        </PreviewBox>
                    );
                }
            },
            settings: ["pb-editor-page-element-settings-delete"],
            target: ["row", "column"],
            onCreate: "open-settings",
            create(options = {}) {
                return {
                    type: "pages-list",
                    data: {
                        resultsPerPage: 10,
                        component: "default",
                        settings: {
                            margin: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            },
                            padding: {
                                desktop: { all: 0 },
                                mobile: { all: 0 }
                            }
                        }
                    },
                    ...options
                };
            },
            render({ element }) {
                return <PagesList data={element.data} />;
            }
        } as PbEditorPageElementPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-pages-list-filter",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return (
                    <Tab icon={<FilterIcon />} label="Filter">
                        <PagesListFilterSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin,
        {
            name: "pb-editor-page-element-advanced-settings-pages-list-design",
            type: "pb-editor-page-element-advanced-settings",
            elementType: "pages-list",
            render(props) {
                return (
                    <Tab icon={<DesignIcon />} label="Design">
                        <PagesListDesignSettings {...props} />
                    </Tab>
                );
            }
        } as PbEditorPageElementAdvancedSettingsPlugin
    ];
};
