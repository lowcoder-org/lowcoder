import React from "react";
import {
  DatasourceForm,
  FormInputItem,
  FormRadioItem,
  FormSection,
} from "lowcoder-design";
import { getVersionOptions } from "@lowcoder-ee/util/versionOptions";
import { trans } from "../../i18n";

export const VersionDataForm = (props: { form: any; preserve: boolean }) => {
  const { form, preserve } = props;
  const versionOptions = getVersionOptions();

  return (
    <DatasourceForm
      form={form}
      preserve={preserve}
      style={{ gap: "12px", marginBottom: "12px" }}
    >
      <FormSection>
        <FormRadioItem
          name={"tag"}
          label={trans("queryLibrary.version")}
          options={versionOptions}
          initialValue={versionOptions[1].value}
        />
        <FormInputItem
          name={"commitMessage"}
          label={trans("queryLibrary.desc")}
        />
      </FormSection>
    </DatasourceForm>
  );
};
