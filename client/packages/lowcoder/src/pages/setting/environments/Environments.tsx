import { EmptyContent } from "components/EmptyContent";
import { HelpText } from "components/HelpText";
import { Upload, Switch, Card, Input, message, Divider } from "antd";
import { TacoButton, CustomSelect, messageInstance } from "lowcoder-design";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { trans } from "i18n";
import { default as ColorPicker } from "antd/es/color-picker";
import {
    DetailContainer,
    DetailContent,
    Header,
  } from "../theme/styledComponents";
import { HeaderBack } from "pages/setting/permission/styledComponents";
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadChangeParam, RcFile } from "antd/es/upload";
import MaterialApi, { MaterialUploadTypeEnum } from "@lowcoder-ee/api/materialApi";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import { buildMaterialPreviewURL } from "@lowcoder-ee/util/materialUtils";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { fetchCommonSettings, setCommonSettings } from "@lowcoder-ee/redux/reduxActions/commonSettingsActions";
import { useShallowEqualSelector } from "@lowcoder-ee/util/hooks";
import { BrandingSettings } from "@lowcoder-ee/api/commonSettingApi";
import { getBrandingSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";

const { TextArea } = Input;

enum SettingsEnum {
  LOGO = "logo",
  SQUARE_LOGO = "squareLogo",
  ERROR_PAGE_IMAGE = "errorPageImage",
  LOGOUT_PAGE_IMAGE = "loggedOutPageImage",
  SIGNUP_PAGE_IMAGE = "signUpPageImage",
  MAIN_BRANDING_COLOR = "mainBrandingColor",
  APP_HEADER_COLOR = "appHeaderColor",
  ADMIN_SIDEBAR_COLOR = "adminSidebarColor",
  ADMIN_SIDEBAR_FONT_COLOR = "adminSidebarFontColor",
  ADMIN_SIDEBAR_ACTIVE_BG_COLOR = "adminSidebarActiveBgColor",
  ADMIN_SIDEBAR_ACTIVE_FONT_COLOR = "adminSidebarActiveFontColor",
  EDITOR_SIDEBAR_COLOR = "editorSidebarColor",
  EDITOR_SIDEBAR_FONT_COLOR = "editorSidebarFontColor",
  EDITOR_SIDEBAR_ACTIVE_BG_COLOR = "editorSidebarActiveBgColor",
  EDITOR_SIDEBAR_ACTIVE_FONT_COLOR = "editorSidebarActiveFontColor",
  FONT = "font",
  ERROR_PAGE_TEXT = "errorPageText",
  SIGNUP_PAGE_TEXT = "signUpPageText",
  LOGGED_OUT_PAGE_TEXT = "loggedOutPageText",
  STANDARD_DESCRIPTION =  "standardDescription",
  STANDARD_TITLE = "standardTitle",
  SHOW_DOCUMENTATION = "showDocumentation",
  DOCUMENTATION_LINK = "documentationLink",
  SUBMIT_ISSUE = "submitIssue",
  WHATS_NEW = "whatsNew",
  WHATS_NEW_LINK = "whatsNewLink",
}

const defaultSettings = {
  logo: null,
  squareLogo: null,
  mainBrandingColor: "#FF5733",
  appHeaderColor: "#2c2c2c",
  adminSidebarColor: "#f7f9fc",
  adminSidebarFontColor: "#000000e0",
  adminSidebarActiveBgColor: "#ebf0f7",
  adminSidebarActiveFontColor: "#4965f2",
  editorSidebarColor: "#f4f4f4",
  editorSidebarFontColor: "",
  editorSidebarActiveBgColor: "",
  editorSidebarActiveFontColor: "",
  font: "Roboto",
  errorPageText: "Oops! Something went wrong.",
  errorPageImage: null,
  signUpPageText: "Join us today to explore new opportunities!",
  signUpPageImage: null,
  loggedOutPageText: "You have been logged out successfully.",
  loggedOutPageImage: null,
  standardDescription: "This is a sample description for SEO.",
  standardTitle: "Welcome to Our Application",
  showDocumentation: true,
  documentationLink: null,
  submitIssue: true,
  whatsNew: false,
  whatsNewLink : null,
};

// type FileType = Parameters<UploadProps["beforeUpload"]>[0] | undefined;

const BrandingSettingContent = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 0px;
  max-width: 100%;
`;

const StyleThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

const StyledRectUploadContainer = styled.div`
  .avatar-uploader {
    width: 240px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    overflow: hidden;
  }

  img {
    width: 240px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const StyledSquareUploadContainer = styled.div`
  .avatar-uploader {
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px dashed #d9d9d9;
    border-radius: 8px;
    overflow: hidden;
  }

  img {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
`;

const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsBinaryString(file); // Read file as base64

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
  
const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/svg+xml";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG/SVG files!");
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }
    return true;
};

export function Environments() {
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [loading, setLoading] = useState({
    [SettingsEnum.LOGO]: false,
    [SettingsEnum.SQUARE_LOGO]: false,
    [SettingsEnum.ERROR_PAGE_IMAGE]: false,
    [SettingsEnum.LOGOUT_PAGE_IMAGE]: false,
    [SettingsEnum.SIGNUP_PAGE_IMAGE]: false,
  });
  const currentUser = useSelector(getUser);
  const dispatch = useDispatch();
  const brandingSettings = useShallowEqualSelector(getBrandingSettings);

  useEffect(() => {
    setSettings(brandingSettings ?? defaultSettings);
  }, [brandingSettings]);

  useEffect(() => {
    dispatch(fetchCommonSettings({ orgId: currentUser.currentOrgId }));
  }, [currentUser.currentOrgId, dispatch]);

  const updateSettings = (key: keyof BrandingSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (options: any, imageType: keyof BrandingSettings) => {
    const { onSuccess, onError, file } = options;

    try {
      setLoading((loading) => ({
        ...loading,
        [imageType]: true,
      }))
      const base64File = await getBase64(file);
      const resp = await MaterialApi.upload(
        file.name,
        MaterialUploadTypeEnum.COMMON,
        btoa(base64File),
      );
      if (validateResponse(resp)) {
        onSuccess(trans("success"));
        updateSettings(imageType, resp.data.data.id);
        return;
      }
      throw new Error("Something went wrong");
    } catch (error: any) {
      onError(error);
      messageInstance.error(trans("home.fileUploadError"));
    } finally {
      setLoading((loading) => ({
        ...loading,
        [imageType]: false,
      }))
    }
  }

  const handleSave = () => {
    dispatch(
      setCommonSettings({
        orgId: currentUser.currentOrgId,
        data: {
          key: 'branding',
          value: settings,
        },
        onSuccess: () => {
          messageInstance.success(trans("advanced.saveSuccess"));
        },
      })
    );
  }

  const uploadButton = (loading: boolean) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <DetailContainer>
      <Header>
        <HeaderBack>
          <span>{trans("branding.title")}</span>
        </HeaderBack>
      </Header>

      <DetailContent>
        <BrandingSettingContent>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("branding.logoSection")}</h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.logo")}</h3>
              <StyledRectUploadContainer>
                <Upload
                  name="logo"
                  className="avatar-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  customRequest={(options) => handleUpload(options, SettingsEnum.LOGO)}
                >
                  {Boolean(settings[SettingsEnum.LOGO])
                    ? <img src={buildMaterialPreviewURL(settings[SettingsEnum.LOGO]!)} alt="logo" />
                    : uploadButton(loading[SettingsEnum.LOGO])
                  }
                </Upload>
                <HelpText>{trans("branding.logoHelp")}</HelpText>
              </StyledRectUploadContainer>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.squareLogo")}</h3>
              <StyledSquareUploadContainer>
                <Upload
                  name="squareLogo"
                  className="avatar-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  customRequest={(options) => handleUpload(options, SettingsEnum.SQUARE_LOGO)}
                >
                  {Boolean(settings[SettingsEnum.SQUARE_LOGO])
                    ? <img src={buildMaterialPreviewURL(settings[SettingsEnum.SQUARE_LOGO]!)} alt="square_logo" />
                    : uploadButton(loading[SettingsEnum.SQUARE_LOGO])
                  }
                </Upload>
                <HelpText>{trans("branding.squareLogoHelp")}</HelpText>
              </StyledSquareUploadContainer>
            </div>
          </Card>
        </BrandingSettingContent>

        <BrandingSettingContent style={{marginTop : "20px"}}>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("branding.colorFontSection")}</h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.mainBrandingColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.mainBrandingColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.MAIN_BRANDING_COLOR, hex)}
              />
              <HelpText>{trans("branding.mainBrandingColorHelp")}</HelpText>
            </div>
            
            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorHeaderColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.appHeaderColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.APP_HEADER_COLOR, hex)}
              />
              <HelpText>{trans("branding.editorHeaderColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.adminSidebarColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.adminSidebarColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_COLOR, hex)}
              />
              <HelpText>{trans("branding.adminSidebarColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.adminSidebarFontColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.adminSidebarFontColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_FONT_COLOR, hex)}
              />
              <HelpText>{trans("branding.adminSidebarFontColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.adminSidebarActiveBgColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.adminSidebarActiveBgColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_ACTIVE_BG_COLOR, hex)}
              />
              <HelpText>{trans("branding.adminSidebarActiveBgColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.adminSidebarActiveFontColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.adminSidebarActiveFontColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_ACTIVE_FONT_COLOR, hex)}
              />
              <HelpText>{trans("branding.adminSidebarActiveFontColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorSidebarColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.editorSidebarColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_COLOR, hex)}
              />
              <HelpText>{trans("branding.editorSidebarColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorSidebarFontColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.editorSidebarFontColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_FONT_COLOR, hex)}
              />
              <HelpText>{trans("branding.editorSidebarFontColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorSidebarActiveBgColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.editorSidebarActiveBgColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_ACTIVE_BG_COLOR, hex)}
              />
              <HelpText>{trans("branding.editorSidebarActiveBgColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorSidebarActiveFontColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                value={settings.editorSidebarActiveFontColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_ACTIVE_FONT_COLOR, hex)}
              />
              <HelpText>{trans("branding.editorSidebarActiveFontColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.font")}</h3>
              <CustomSelect
                options={[] /* Dynamically populate Google Fonts */}
                value={settings.font}
                onChange={(font) => updateSettings(SettingsEnum.FONT, font)}
              />
              <HelpText>{trans("branding.fontHelp")}</HelpText>
            </div>
          </Card>
        </BrandingSettingContent>

        <BrandingSettingContent style={{marginTop : "20px"}}>
          <StyleThemeSettingsCover>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>{trans("branding.textSection")}</h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.errorPage")}</h3>
              <TextArea
                rows={4}
                value={settings.errorPageText || ""}
                onChange={(e) => updateSettings(SettingsEnum.ERROR_PAGE_TEXT, e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <HelpText>{trans("branding.errorPageHelp")}</HelpText>
              <h3 style={{marginTop : "20px"}}>{trans("branding.errorPageImage")}</h3>
              <StyledRectUploadContainer>
                <Upload
                  name="errorPageImage"
                  className="avatar-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  customRequest={(options) => handleUpload(options, SettingsEnum.ERROR_PAGE_IMAGE)}
                >
                  {Boolean(settings[SettingsEnum.ERROR_PAGE_IMAGE])
                    ? <img src={buildMaterialPreviewURL(settings[SettingsEnum.ERROR_PAGE_IMAGE]!)} alt="error_page_image" />
                    : uploadButton(loading[SettingsEnum.ERROR_PAGE_IMAGE])
                  }
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div>
              <h3 style={{marginTop : "20px"}}>{trans("branding.signUpPage")}</h3>
              <TextArea
                rows={4}
                value={settings.signUpPageText || ""}
                onChange={(e) => updateSettings(SettingsEnum.SIGNUP_PAGE_TEXT, e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <HelpText>{trans("branding.signUpPageHelp")}</HelpText>
              <h3 style={{marginTop : "20px"}}>{trans("branding.signUpPageImage")}</h3>
              <StyledRectUploadContainer>
                <Upload
                  name="signUpPageImage"
                  className="avatar-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  customRequest={(options) => handleUpload(options, SettingsEnum.SIGNUP_PAGE_IMAGE)}
                >
                  {Boolean(settings[SettingsEnum.SIGNUP_PAGE_IMAGE])
                    ? <img src={buildMaterialPreviewURL(settings[SettingsEnum.SIGNUP_PAGE_IMAGE]!)} alt="signup_page_image" />
                    : uploadButton(loading[SettingsEnum.SIGNUP_PAGE_IMAGE])
                  }
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div>
              <h3 style={{marginTop : "20px"}}>{trans("branding.loggedOutPage")}</h3>
              <TextArea
                rows={4}
                value={settings.loggedOutPageText || ""}
                onChange={(e) => updateSettings(SettingsEnum.LOGGED_OUT_PAGE_TEXT, e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <HelpText>{trans("branding.loggedOutPageHelp")}</HelpText>
              <h3 style={{marginTop : "20px"}}>{trans("branding.loggedOutPageImage")}</h3>
              <StyledRectUploadContainer>
                <Upload
                  name="loggedOutPageImage"
                  className="avatar-uploader"
                  listType="picture-card"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  customRequest={(options) => handleUpload(options, SettingsEnum.LOGOUT_PAGE_IMAGE)}
                >
                  {Boolean(settings[SettingsEnum.LOGOUT_PAGE_IMAGE])
                    ? <img src={buildMaterialPreviewURL(settings[SettingsEnum.LOGOUT_PAGE_IMAGE]!)} alt="logout_page_image" />
                    : uploadButton(loading[SettingsEnum.LOGOUT_PAGE_IMAGE])
                  }
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.standardDescription")}</h3>
              <TextArea
                rows={2}
                value={settings.standardDescription || ""}
                onChange={(e) => updateSettings(SettingsEnum.STANDARD_DESCRIPTION, e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.standardTitle")}</h3>
              <TextArea
                rows={2}
                value={settings.standardTitle || ""}
                onChange={(e) => updateSettings(SettingsEnum.STANDARD_TITLE, e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.submitIssue")}</h3>
              <Switch
                checked={settings.submitIssue}
                onChange={(checked) => updateSettings(SettingsEnum.SUBMIT_ISSUE, checked)}
              />
            </div>

          </Card>


          <StyleThemeSettingsCover style={{marginTop : "20px"}}>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>
              {trans("branding.showDocumentationSection")}
            </h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.showDocumentation")}</h3>
              <Switch
                checked={settings.showDocumentation}
                onChange={(checked) => updateSettings(SettingsEnum.SHOW_DOCUMENTATION, checked)}
              />
            </div>
            {settings.showDocumentation && (
              <div style={{ marginTop: "20px" }}>
                <h3>{trans("branding.documentationLink")}</h3>
                <Input
                  placeholder={trans("branding.documentationLinkPlaceholder")}
                  value={settings.documentationLink || ""}
                  onChange={(e) => updateSettings(SettingsEnum.DOCUMENTATION_LINK, e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <HelpText>{trans("branding.documentationLinkHelp")}</HelpText>
              </div>
            )}
          </Card>

          <StyleThemeSettingsCover style={{marginTop : "20px"}}>
            <h2 style={{ color: "#ffffff", marginTop: "8px" }}>
              {trans("branding.showWhatsNewSection")}
            </h2>
          </StyleThemeSettingsCover>
          <Card>
            <div>
              <h3>{trans("branding.whatsNew")}</h3>
              <Switch
                checked={settings.whatsNew}
                onChange={(checked) => updateSettings(SettingsEnum.WHATS_NEW, checked)}
              />
            </div>
            {settings.whatsNew && (
              <div style={{ marginTop: "20px" }}>
                <h3>{trans("branding.whatsNewLink")}</h3>
                <Input
                  placeholder={trans("branding.whatsNewLinkPlaceholder")}
                  value={settings.whatsNewLink || ""}
                  onChange={(e) => updateSettings(SettingsEnum.WHATS_NEW_LINK, e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <HelpText>{trans("branding.whatsNewLinkHelp")}</HelpText>
              </div>
            )}
          </Card>
        </BrandingSettingContent>

        <TacoButton
          onClick={handleSave}
          style={{ marginTop: 20 }}
        >
          {trans("branding.saveButton")}
        </TacoButton>
      </DetailContent>
    </DetailContainer>
  );
}
