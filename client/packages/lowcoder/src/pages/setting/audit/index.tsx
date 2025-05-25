import { HelpText } from "components/HelpText";
import { GreyTextColor } from "constants/style";
import { lazy, useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCommonSettings } from "redux/reduxActions/commonSettingsActions";
import { getCommonSettings } from "redux/selectors/commonSettingSelectors";
import { fetchAPIUsageAction, fetchLastMonthAPIUsageAction } from "redux/reduxActions/orgActions";
import { getUser } from "redux/selectors/usersSelectors";
import { getOrgApiUsage, getOrgLastMonthApiUsage } from "redux/selectors/orgSelectors";
import styled from "styled-components";
import { useShallowEqualSelector } from "util/hooks";
import { Level1SettingPageContent, Level1SettingPageTitle } from "../styled";
import { fetchAllApplications } from "redux/reduxActions/applicationActions";
import { trans } from "i18n";
import { Location } from "history";
import Divider from "antd/es/divider";
import { CustomSelect, TacoButton } from "lowcoder-design";
import { getDeploymentId } from "@lowcoder-ee/redux/selectors/configSelectors";

const AdvancedSettingContent = styled.div`
  max-width: 840px;

  .section-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .section-content {
    margin-bottom: 28px;
  }

  .section-option {
    color: ${GreyTextColor};
    margin-bottom: 14px;
    font-size: 13px;
  }

  .code-editor {
    margin-bottom: 12px;
  }
`;

const SaveButton = styled(TacoButton)`
  padding: 4px 8px;
  min-width: 84px;
  height: 32px;
`;

const CustomSelectStyle = styled(CustomSelect)`
  .ant-select .ant-select-selector .ant-select-selection-item {
    max-width: 230px;
    display: block;
  }
`;

const HubspotFormContainer = styled.div`
  max-width: 100%;
  width: 100%;
  .hs-form {
    max-width: 100% !important;
  }
`;

let locationInfo: Location | Location<unknown> | null = null;

declare global {
  interface Window {
    hbspt: {
      forms: {
        create: (options: {
          region: string;
          portalId: string;
          formId: string;
          target: string | HTMLElement | null;
        }) => void;
      };
    };
  }
}

export default function Audit() {
  const dispatch = useDispatch();
  const currentUser = useSelector(getUser);
  const commonSettings = useShallowEqualSelector(getCommonSettings);
  const [settings, setSettings] = useState(commonSettings);
  const deploymentId = useSelector(getDeploymentId);


  const apiUsage = useSelector(getOrgApiUsage);
  useEffect(() => {
    dispatch(fetchAPIUsageAction(currentUser.currentOrgId));
  }, [currentUser.currentOrgId])

  const lastMonthApiUsage = useSelector(getOrgLastMonthApiUsage);
  useEffect(() => {
    dispatch(fetchLastMonthAPIUsageAction(currentUser.currentOrgId));
  }, [currentUser.currentOrgId])

  useEffect(() => {
    dispatch(fetchCommonSettings({ orgId: currentUser.currentOrgId }));
    dispatch(fetchAllApplications({}));
  }, [currentUser.currentOrgId, dispatch]);

  useEffect(() => {
    setSettings(commonSettings);
  }, [commonSettings]);

  useEffect(() => {
    dispatch(fetchCommonSettings({ orgId: currentUser.currentOrgId }));
  }, [currentUser.currentOrgId, dispatch]);

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scriptId = "hubspot-script";
  
    // Prevent re-adding the script
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
  
    const createForm = () => {
      // Wait a tick to ensure #hubspot-form is in the DOM
      setTimeout(() => {
        if (window.hbspt && document.querySelector("#hubspot-form")) {
          window.hbspt.forms.create({
            region: "eu1",
            portalId: "144574215",
            formId: "f03697ad-62cf-4161-a3de-228a2db1180b",
            target: "#hubspot-form"
          });
        }
      }, 0);
    };
  
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://js-eu1.hsforms.net/forms/embed/v2.js";
      script.async = true;
      script.defer = true;
      script.id = scriptId;
      script.onload = createForm;
      document.body.appendChild(script);
    } else {
      if (window.hbspt) {
        createForm();
      } else {
        existingScript.addEventListener("load", createForm);
      }
    }
  }, []);
  
  

  return (
    <Level1SettingPageContent>
      <Level1SettingPageTitle>{trans("advanced.title")}</Level1SettingPageTitle>
      <AdvancedSettingContent>
        <div className="section-title">{trans("advanced.defaultHomeTitle")}</div>
        <HelpText style={{ marginBottom: 12 }}>{trans("advanced.defaultHomeHelp")}</HelpText>
        <div className="section-content">
          <Divider />
          <HubspotFormContainer>
            <div id="hubspot-form" />
          </HubspotFormContainer>
        </div>
      </AdvancedSettingContent>
    </Level1SettingPageContent>
  );
}
