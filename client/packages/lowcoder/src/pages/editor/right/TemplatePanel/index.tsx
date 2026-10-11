import { trans } from "i18n";
import { useMemo, useState } from "react";
import { TemplateItem } from "./TemplateItem";
import { useDispatch, useSelector } from "react-redux";
import { setCommonSettings } from "redux/reduxActions/commonSettingsActions";
import { getUser } from "redux/selectors/usersSelectors";
import { BluePlusIcon, CustomModal, TacoButton, TacoInput } from "lowcoder-design";
import { getCommonSettings } from "redux/selectors/commonSettingSelectors";
import styled from "styled-components";
import { normalizeNpmPackage, validateNpmPackage } from "comps/utils/remote";
import { ComListTitle, ExtensionContentWrapper } from "../styledComponent";
import { EmptyContent } from "components/EmptyContent";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import { isPublicApplication } from "@lowcoder-ee/redux/selectors/applicationSelector";

const Footer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 24px;
  margin-bottom: 24px;
`;

export default function TemplatePanel() {
  const dispatch = useDispatch();
  const [isAddModalShow, showAddModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const user = useSelector(getUser);
  const commonSettings = useSelector(getCommonSettings);
  const isPublicApp = useSelector(isPublicApplication);

  const templates = useMemo(
    () =>
      (commonSettings?.npmTemplates || []).map((i) => {
        return {
          name: normalizeNpmPackage(i),
          raw: i,
        };
      }),
    [commonSettings?.npmTemplates]
  );

  const handleSetNpmTemplates = (nextNpmTemplates: string[]) => {
    dispatch(
      setCommonSettings({
        orgId: user.currentOrgId,
        isPublicApp,
        data: {
          key: "npmTemplates",
          value: nextNpmTemplates,
        },
      })
    );
  };

  const handleAddNewTemplate = () => {
    if (!newTemplateName) {
      return;
    }
    if (!validateNpmPackage(newTemplateName)) {
      messageInstance.error(trans("npm.invalidNpmPackageName"));
      return;
    }
    if (
      commonSettings.npmTemplates?.find(
        (i) => normalizeNpmPackage(i) === normalizeNpmPackage(newTemplateName)
      )
    ) {
      messageInstance.error(trans("npm.templateExisted"));
      return;
    }
    const nextNpmTemplates = (commonSettings?.npmTemplates || []).concat(newTemplateName);
    handleSetNpmTemplates(nextNpmTemplates);
    setNewTemplateName("");
    showAddModal(false);
  };

  const handleRemove = (name: string) => {
    const nextNpmTemplates = commonSettings?.npmTemplates?.filter((i) => i !== name) || [];
    handleSetNpmTemplates(nextNpmTemplates);
  };

  const items = templates.map((i) => (
    <TemplateItem key={i.name} name={i.name} onRemove={() => handleRemove(i.raw)} />
  ));

  const empty = (
    <EmptyContent style={{ marginBottom: 8 }} text={trans("rightPanel.emptyTemplates")} />
  );

  return (
    <>
      <ComListTitle>{trans("rightPanel.templateListTitle")}</ComListTitle>
      <ExtensionContentWrapper>{items.length > 0 ? items : empty}</ExtensionContentWrapper>
      <Footer>
        <TacoButton icon={<BluePlusIcon />} buttonType="blue" onClick={() => showAddModal(true)}>
          {trans("npm.addTemplateBtnText")}
        </TacoButton>
      </Footer>
      <CustomModal
        centered
        showOkButton
        showCancelButton
        title={trans("npm.addTemplateModalTitle")}
        open={isAddModalShow}
        onOk={handleAddNewTemplate}
        onCancel={() => showAddModal(false)}
      >
        <span style={{ display: "block", marginBottom: "4px" }}>
          {trans("npm.templateNameLabel")}
        </span>
        <TacoInput
          autoFocus
          onPressEnter={() => {
            handleAddNewTemplate();
          }}
          onChange={(e) => {
            setNewTemplateName(e.target.value);
          }}
          value={newTemplateName}
        />
      </CustomModal>
    </>
  );
}
