import React, { useCallback, useMemo } from "react";
import { i18n } from "@webiny/app/i18n";
import { Form } from "@webiny/form";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ButtonPrimary } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { useMutation, useQuery } from "react-apollo";
import {
    SimpleForm,
    SimpleFormFooter,
    SimpleFormContent,
    SimpleFormHeader
} from "@webiny/app-admin/components/SimpleForm";
import { validation } from "@webiny/validation";
import { GET_CATEGORY, CREATE_CATEGORY, UPDATE_CATEGORY, LIST_CATEGORIES } from "./graphql";
import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Input } from "@webiny/ui/Input";
import { categoryUrlValidator } from "./validators";
import { getPlugins } from "@webiny/plugins";
import { PbPageLayoutPlugin } from "@webiny/app-page-builder/types";
import { Select } from "@webiny/ui/Select";
import { useSecurity } from "@webiny/app-security";
import pick from "object.pick";

const t = i18n.ns("app-page-builder/admin/categories/form");

const CategoriesForm = () => {
    const { location, history } = useRouter();
    const { showSnackbar } = useSnackbar();

    const layouts = React.useMemo(
        () => getPlugins<PbPageLayoutPlugin>("pb-page-layout").map(pl => pl.layout),
        []
    );

    const slug = new URLSearchParams(location.search).get("slug");

    const getQuery = useQuery(GET_CATEGORY, {
        variables: { slug },
        skip: !slug,
        onCompleted: data => {
            const error = data?.pageBuilder?.getCategory?.error;
            if (error) {
                history.push("/page-builder/categories");
                showSnackbar(error.message);
            }
        }
    });

    const loadedCategory = getQuery.data?.pageBuilder?.getCategory?.data || {};

    const [create, createMutation] = useMutation(CREATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const [update, updateMutation] = useMutation(UPDATE_CATEGORY, {
        refetchQueries: [{ query: LIST_CATEGORIES }]
    });

    const loading = [getQuery, createMutation, updateMutation].find(item => item.loading);

    const onSubmit = useCallback(
        async formData => {
            const isUpdate = loadedCategory.slug;
            const data = pick(formData, ["slug", "name", "url", "layout"]);

            const [operation, args] = isUpdate
                ? [update, { variables: { slug: formData.slug, data } }]
                : [create, { variables: { data } }];

            const response = await operation(args);

            const error = response?.data?.pageBuilder?.category?.error;
            if (error) {
                return showSnackbar(error.message);
            }

            !isUpdate && history.push(`/page-builder/categories?slug=${formData.slug}`);
            showSnackbar(t`Category saved successfully.`);
        },
        [loadedCategory.slug]
    );

    const data = useMemo(() => {
        return getQuery.data?.pageBuilder?.getCategory.data || {};
    }, [loadedCategory.slug]);

    const { identity } = useSecurity();
    const pbMenuPermission = useMemo(() => {
        return identity.getPermission("pb.category");
    }, []);

    const canSave = useMemo(() => {
        if (pbMenuPermission.own) {
            return loadedCategory?.createdBy?.id === identity.login;
        }

        if (typeof pbMenuPermission.rwd === "string") {
            return pbMenuPermission.rwd.includes("w");
        }

        return true;
    }, [loadedCategory.slug]);

    return (
        <Form data={data} onSubmit={onSubmit}>
            {({ data, form, Bind }) => (
                <SimpleForm>
                    {loading && <CircularProgress />}
                    <SimpleFormHeader title={data.slug || t`New category`} />
                    <SimpleFormContent>
                        <Grid>
                            <Cell span={6}>
                                <Bind name="name" validators={validation.create("required")}>
                                    <Input label={t`Name`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="slug" validators={validation.create("required")}>
                                    <Input disabled={data.createdOn} label={t`Slug`} />
                                </Bind>
                            </Cell>
                            <Cell span={12}>
                                <Bind
                                    name="url"
                                    validators={[
                                        validation.create("required"),
                                        categoryUrlValidator
                                    ]}
                                >
                                    <Input disabled={data.id} label={t`URL`} />
                                </Bind>
                            </Cell>
                            <Cell span={6}>
                                <Bind name="layout" defaultValue={layouts[0].name}>
                                    <Select label={t`Layout`}>
                                        {layouts.map(({ name, title }) => (
                                            <option key={name} value={name}>
                                                {title}
                                            </option>
                                        ))}
                                    </Select>
                                </Bind>
                            </Cell>
                        </Grid>
                    </SimpleFormContent>
                    <SimpleFormFooter>
                        {canSave && (
                            <ButtonPrimary onClick={form.submit}>{t`Save category`}</ButtonPrimary>
                        )}
                    </SimpleFormFooter>
                </SimpleForm>
            )}
        </Form>
    );
};

export default CategoriesForm;
