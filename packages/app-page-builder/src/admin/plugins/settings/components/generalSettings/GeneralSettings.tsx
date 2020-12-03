import * as React from "react";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { ButtonPrimary } from "@webiny/ui/Button";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";

import { Query, Mutation } from "react-apollo";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { GET_SETTINGS, UPDATE_SETTINGS } from "./graphql";
import { CircularProgress } from "@webiny/ui/Progress";
import { get, set } from "lodash";
import { validation } from "@webiny/validation";
import { sendEvent, setProperties } from "@webiny/tracking/react";

import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { DOMAIN_QUERY } from "@webiny/app-page-builder/admin/hooks/usePageBuilderSettings/usePageBuilderSettings";

const GeneralSettings = () => {
    const { showSnackbar } = useSnackbar();
    return (
        <Query query={GET_SETTINGS}>
            {({ data, loading: queryInProgress }) => {
                const settings = get(data, "pageBuilder.getSettings.data") || {};
                return (
                    <Mutation
                        mutation={UPDATE_SETTINGS}
                        update={(cache, { data }) => {
                            const dataFromCache = cache.readQuery({ query: DOMAIN_QUERY });
                            const updatedSettings = get(data, "pageBuilder.updateSettings.data");

                            if (updatedSettings) {
                                cache.writeQuery({
                                    query: DOMAIN_QUERY,
                                    data: set(
                                        dataFromCache,
                                        "pageBuilder.getSettings.data",
                                        updatedSettings
                                    )
                                });
                            }
                        }}
                    >
                        {(update, { loading: mutationInProgress }) => (
                            <Form
                                data={settings}
                                onSubmit={async data => {
                                    data.domain = (data.domain || "").replace(/\/+$/g, "");

                                    if (
                                        settings.domain !== data.domain &&
                                        !data.domain.includes("localhost")
                                    ) {
                                        sendEvent("custom-domain", {
                                            domain: data.domain
                                        });
                                        setProperties({
                                            domain: data.domain
                                        });
                                    }

                                    delete data.id;
                                    await update({ variables: { data } });
                                    showSnackbar("Settings updated successfully.");
                                }}
                            >
                                {({ Bind, form }) => (
                                    <SimpleForm>
                                        {(queryInProgress || mutationInProgress) && (
                                            <CircularProgress />
                                        )}
                                        <SimpleFormHeader title={`General Settings`} />
                                        <SimpleFormContent>
                                            <Grid>
                                                <Cell span={6}>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"name"}
                                                                validators={validation.create(
                                                                    "required"
                                                                )}
                                                            >
                                                                <Input label="Website name" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind name={"domain"}>
                                                                <Input
                                                                    label="Domain"
                                                                    description={
                                                                        "eg. https://www.mysite.com"
                                                                    }
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={6}>
                                                            <Bind name={"favicon"}>
                                                                <SingleImageUpload
                                                                    onChangePick={["id", "src"]}
                                                                    label="Favicon"
                                                                    accept={[
                                                                        "image/png",
                                                                        "image/x-icon",
                                                                        "image/vnd.microsoft.icon"
                                                                    ]}
                                                                    description={
                                                                        <span>
                                                                            Supported file types:{" "}
                                                                            <strong>.png</strong>{" "}
                                                                            and{" "}
                                                                            <strong>.ico</strong> .
                                                                        </span>
                                                                    }
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={6}>
                                                            <Bind name={"logo"}>
                                                                <SingleImageUpload
                                                                    label="Logo"
                                                                    onChangePick={["id", "src"]}
                                                                />
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>
                                                </Cell>

                                                <Cell span={6}>
                                                    <Grid>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.facebook"}
                                                                validators={validation.create(
                                                                    "url"
                                                                )}
                                                            >
                                                                <Input label="Facebook" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.twitter"}
                                                                validators={validation.create(
                                                                    "url"
                                                                )}
                                                            >
                                                                <Input label="Twitter" />
                                                            </Bind>
                                                        </Cell>
                                                        <Cell span={12}>
                                                            <Bind
                                                                name={"social.instagram"}
                                                                validators={validation.create(
                                                                    "url"
                                                                )}
                                                            >
                                                                <Input label="Instagram" />
                                                            </Bind>
                                                        </Cell>
                                                    </Grid>
                                                </Cell>
                                            </Grid>
                                        </SimpleFormContent>
                                        <SimpleFormFooter>
                                            <ButtonPrimary onClick={form.submit}>
                                                Save
                                            </ButtonPrimary>
                                        </SimpleFormFooter>
                                    </SimpleForm>
                                )}
                            </Form>
                        )}
                    </Mutation>
                );
            }}
        </Query>
    );
};

export default GeneralSettings;
