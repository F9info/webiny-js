import React, { useState, useCallback } from "react";
import { usePublishRevisionHandler } from "../../utils/usePublishRevisionHandler";
import PublishRevisionDialog from "./PublishRevisionDialog";
import { IconButton } from "@webiny/ui/Button";
import { Tooltip } from "@webiny/ui/Tooltip";
import PublishIcon from "@webiny/app-page-builder/admin/assets/round-publish-24px.svg";
import { get } from "lodash";

function getPublishSuggestion(page, revisions) {
    if (!page.published) {
        return page.id;
    }

    if (revisions[0]) {
        return revisions[0].id;
    }

    return "";
}

function getPublishableRevisions(revisions) {
    return revisions
        .filter(r => !r.published)
        .sort((a, b) => {
            // @ts-ignore
            return new Date(b.savedOn) - new Date(a.savedOn);
        });
}

const PublishRevision = (props) => {
    const { page } = props;
    const { publishRevision } = usePublishRevisionHandler({ page });
    const publishableRevisions = getPublishableRevisions(get(page, "revisions") || []);
    const publishSuggestion = getPublishSuggestion(page, publishableRevisions);
    const [openDialog, setOpenDialog] = useState(false);

    const showDialog = useCallback(() => setOpenDialog(true), []);
    const hideDialog = useCallback(() => setOpenDialog(false), []);

    const onSubmit = useCallback(
        revision => {
            hideDialog();
            return publishRevision(revision);
        },
        [publishRevision]
    );

    if (!publishableRevisions.length) {
        return null;
    }

    return (
        <React.Fragment>
            <Tooltip content={"Publish"} placement={"top"}>
                <IconButton icon={<PublishIcon />} onClick={showDialog} />
            </Tooltip>
            <PublishRevisionDialog
                open={openDialog}
                onClose={hideDialog}
                onSubmit={onSubmit}
                selected={publishSuggestion}
                revisions={publishableRevisions}
            />
        </React.Fragment>
    );
};

export default PublishRevision;
