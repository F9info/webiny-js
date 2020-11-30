import { flow } from "lodash";
import { onGet, object, fields, withFields, withProps } from "@webiny/commodo";
import { validation } from "@webiny/validation";
import onGetI18NValues from "./onGetI18NValues";

export type I18NObject = {
    context: any;
    [key: string]: any;
};

export default ({ context: { i18n, commodo }, ...rest }: I18NObject) => {
    const { id } = commodo.fields;

    return fields({
        ...rest,
        value: {},
        instanceOf: flow(
            withFields({
                values: onGet(value => onGetI18NValues(value, i18n))(
                    fields({
                        list: true,
                        value: [],
                        instanceOf: withFields({
                            locale: id({ validation: validation.create("required") }),
                            value: object()
                        })()
                    })
                )
            }),
            withProps({
                get value() {
                    const locale = i18n.getLocale();
                    const value = this.values.find(value => value.locale === locale.code);
                    return value ? value.value : "";
                }
            })
        )()
    });
};
