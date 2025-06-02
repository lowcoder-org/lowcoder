import { HelpText } from "components/HelpText";
import { Upload, Switch, Card, Input, message, Divider, Row, Col, Image } from "antd";
import { TacoButton, CustomSelect, messageInstance, Dropdown, ResetIcon, CustomModal } from "lowcoder-design";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import type { UploadChangeParam, RcFile } from "antd/es/upload/interface";
import MaterialApi, { MaterialUploadTypeEnum } from "@lowcoder-ee/api/materialApi";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import { buildMaterialPreviewURL } from "@lowcoder-ee/util/materialUtils";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { Org } from "@lowcoder-ee/constants/orgConstants";
import { BrandingConfig, BrandingSettings, createBranding, getBranding } from "@lowcoder-ee/api/enterpriseApi";
import Flex from "antd/es/flex";
import { fetchBrandingSetting } from "@lowcoder-ee/redux/reduxActions/enterpriseActions";
import { Level1SettingPageTitle } from "../styled";
import Title from "antd/es/typography/Title";
import Paragraph from "antd/es/typography/Paragraph";

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
  mainBrandingColor: "#B480DE",
  appHeaderColor: "#2c2c2c",
  adminSidebarColor: "#f7f9fc",
  adminSidebarFontColor: "#000000e0",
  adminSidebarActiveBgColor: "#ebf0f7",
  adminSidebarActiveFontColor: "#4965f2",
  editorSidebarColor: "#393b47",
  editorSidebarFontColor: "#ffffffa6",
  editorSidebarActiveBgColor: "#8b8fa37f",
  editorSidebarActiveFontColor: "#ffffff",
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

const settingDescription = {
  logo: "The main logo displayed in the application header",
  squareLogo: "Square or icon-style logo used where space is limited, like browser tabs or mobile headers.",
  mainBrandingColor: "Core brand color used for branding across the app.",
  appHeaderColor: "Background color of the application's top header/navigation bar.",
  adminSidebarColor: "Background color of the admin panel's sidebar.",
  adminSidebarFontColor: "Text color of the menu items in the admin sidebar.",
  adminSidebarActiveBgColor: "Background color for the active/selected item in the admin sidebar.",
  adminSidebarActiveFontColor: "Text color for the active/selected item in the admin sidebar.",
  editorSidebarColor: "Background color of the editor (e.g., page builder) sidebar.",
  editorSidebarFontColor: "Text color for items in the editor sidebar.6",
  editorSidebarActiveBgColor: "Background color for the active item in the editor sidebar.",
  editorSidebarActiveFontColor: "Text color for the active item in the editor sidebar.",
  font: "Font family used throughout the app interface. Typically selected from Google Fonts.",
  errorPageText: "Display a custom message and image when the app fails to load or encounters a critical error.",
  errorPageImage: "Optional illustration or graphic shown on error pages.",
  signUpPageText: "Customize the Sign Up page with a welcome message and an optional image to match your brand.",
  signUpPageImage: "Optional graphic displayed on the signup page.",
  loggedOutPageText: "You have been logged out successfully.",
  loggedOutPageImage: null,
  standardDescription: "Default description text used in metadata (e.g., SEO or share cards).",
  standardTitle: "Set a default title and description for SEO and social media sharing when specific page metadata isn't provided",
  showDocumentation: "Toggles whether a documentation link should appear in the app UI.",
  documentationLink: null,
  submitIssue: "Enables a link or button for users to report issues or bugs.",
  whatsNew: "Enables display of new features, updates, or changelogs in the app.",
  whatsNewLink : null,
};

const fonts = [
  {label: 'Roboto', value: 'Roboto'},
  {label: 'Open Sans', value: 'Open+Sans'},
  {label: 'Lato', value: 'Lato'},
  {label: 'Montserrat', value: 'Montserrat'},
  {label: 'Poppins', value: 'Poppins'},
  {label: 'Inter', value: 'Inter'},
  {label: 'Merriweather', value: 'Merriweather'},
  {label: 'Playfair Display', value: 'Playfair+Display'},
  {label: 'Raleway', value: 'Raleway'},
  {label: 'Nunito', value: 'Nunito'},
]
// type FileType = Parameters<UploadProps["beforeUpload"]>[0] | undefined;

const StyledBrandingSettingContent = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 0px;
  padding-left: 0px;
  max-width: 100%;
  margin-top: 20px;
`;

const StyledThemeSettingsCover = styled.div`
  display: flex;
  flex-direction: row;
  background: linear-gradient(34deg, rgba(2, 0, 36, 1) 0%, rgba(102, 9, 121, 1) 35%, rgba(0, 255, 181, 1) 100%);
  padding: 15px;
  height: 80px;
  border-radius: 10px 10px 0 0;
`;

const StyledCoverTitle = styled.h2`
  color: #ffffff;
  margin-top: 8px;
`;

const StyledSectionTitle = styled.h3`
  margin-bottom: 12px;
`;

const StyledInput = styled(Input)`
  margin-bottom: 12px;
`;

const StyledTextArea = styled(TextArea)`
  margin-bottom: 12px;
`;

const StyledDropdown = styled(Dropdown)`
  width: 300px;
`;

const StyledImage = styled(Image)`
  border-radius: 6px;
  box-shadow: 0px 0px 8px 0px lightgray;
  object-fit: cover;
  object-position: top;
`;

const StyledCustomSelect = styled(CustomSelect)`
  min-width: 150px;
`;

const StyledRow = styled(Row)`
  padding: 10px 0;
`;

const StyledButtonContainer = styled(Flex)`
  margin-top: 20px;
`;

const StyledDivider = styled(Divider)`
  margin: 20px 0;
`;

const StyledSwitchContainer = styled.div`
  margin-top: 20px;
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
    reader.readAsBinaryString(file);

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

export function BrandingSetting() {
  const dispatch = useDispatch();
  const [configOrgId, setConfigOrgId] = useState<string>('');
  const [configOrgName, setConfigOrgName] = useState<string | undefined>('Global');
  const [settings, setSettings] = useState<BrandingSettings>(defaultSettings);
  const [brandingConfig, setBrandingConfig] = useState<BrandingConfig>();
  const [defaultBrandingConfig, setDefaultBrandingConfig] = useState<BrandingConfig>();
  const [loading, setLoading] = useState({
    [SettingsEnum.LOGO]: false,
    [SettingsEnum.SQUARE_LOGO]: false,
    [SettingsEnum.ERROR_PAGE_IMAGE]: false,
    [SettingsEnum.LOGOUT_PAGE_IMAGE]: false,
    [SettingsEnum.SIGNUP_PAGE_IMAGE]: false,
  });
  const currentUser = useSelector(getUser);

  const orgsList = useMemo(() => {
    const list: Array<{label: string, value: string}> = [{
      label: 'Global',
      value: '',
    }];
    currentUser?.orgs?.forEach((org: Org) => {
      list.push({
        value: org.id,
        label: org.name,
      });
    });
    return list;
  }, [currentUser]);

  useEffect(() => {
    const fetchBrandingDetails = async() => {
      try {
        const branding = await getBranding(configOrgId);
        setBrandingConfig(branding);
        setDefaultBrandingConfig(branding);
      } catch(e) {
        setBrandingConfig(undefined);
        setDefaultBrandingConfig(undefined);
        // message.error(trans("branding.fetchBrandingError"));
      }
    }

    fetchBrandingDetails();
  }, [configOrgId]);

  const isBrandingNotChange = useCallback(() => {
    return JSON.stringify(brandingConfig) === JSON.stringify(defaultBrandingConfig);
  }, [brandingConfig, defaultBrandingConfig]);

  const updateSettings = (key: keyof BrandingSettings, value: any) => {
    setBrandingConfig((branding) => ({
      ...branding,
      config_set: {
        ...branding?.config_set,
        [key]: value
      }
    }));
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

  const handleSave = async (brandingConfig?: BrandingConfig) => {
    try {
      await createBranding({
        ...brandingConfig,
        org_id: configOrgId,
      });
      setDefaultBrandingConfig(brandingConfig);
      messageInstance.success(trans("theme.saveSuccessMsg"));

      dispatch(fetchBrandingSetting({orgId: configOrgId}));
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = (id: string) => {
    CustomModal.confirm({
      title: trans("branding.deleteBranding"),
      content: trans("branding.deleteBrandingContent", {orgName: configOrgName}),
      onConfirm: () => {
        const newBrandingConfig = {
          ...brandingConfig,
          config_name: '',
          config_description: '',
          config_icon: '',
          config_set: {},
        }
        setBrandingConfig(newBrandingConfig);
        handleSave(newBrandingConfig);
      },
      confirmBtnType: "delete",
      okText: trans("delete"),
    })
  }

  const uploadButton = useCallback((loading: boolean) => (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>{trans("branding.upload")}</div>
    </div>
  ), []);

  return (
    <DetailContainer>
      <Header>
        <Level1SettingPageTitle style={{marginBottom: 0}}>
          <span>{trans("branding.title")}</span>
        </Level1SettingPageTitle>
      </Header>
      <DetailContent>
      
      {/* Branding Settings Selection */}
      <StyledBrandingSettingContent>
          <StyledThemeSettingsCover>
            <StyledCoverTitle>{trans("branding.general")}</StyledCoverTitle>
          </StyledThemeSettingsCover>
          <Card>
            <div>
              <StyledSectionTitle>{trans("branding.selectWorkspace")}</StyledSectionTitle>
              <StyledDropdown
                placeholder={trans("branding.selectWorkspace")}
                options={orgsList}
                allowClear
                onChange={(value) => {
                  setConfigOrgId(value);
                  setConfigOrgName(orgsList.find(org => org.value === value)?.label)
                }}
                value={configOrgId}
              />
            </div>

            <div>
              <StyledSectionTitle>{trans("branding.brandingName")}</StyledSectionTitle>
              <StyledInput
                placeholder={trans("branding.brandingNamePlaceholder")}
                value={brandingConfig?.config_name}
                onChange={(e) => {
                  setBrandingConfig((branding) => ({
                    ...(branding || {}),
                    config_name: e.target.value
                  }))
                }}
              />
              {/* <HelpText>{trans("branding.documentationLinkHelp")}</HelpText> */}
            </div>

            <div>
              <StyledSectionTitle>{trans("branding.brandingDescription")}</StyledSectionTitle>
              <StyledInput
                placeholder={trans("branding.brandingDescriptionPlaceholder")}
                value={brandingConfig?.config_description}
                onChange={(e) => {
                  setBrandingConfig((branding) => ({
                    ...(branding || {}),
                    config_description: e.target.value
                  }))
                }}
              />
              {/* <HelpText>{trans("branding.documentationLinkHelp")}</HelpText> */}
            </div>
          </Card>
        </StyledBrandingSettingContent>

        {/* General Logos */}
        <StyledBrandingSettingContent>
          <StyledThemeSettingsCover>
            <StyledCoverTitle>{trans("branding.logoSection")}</StyledCoverTitle>
          </StyledThemeSettingsCover>
          <Card>
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.logo")}</StyledSectionTitle>
                {!Boolean(configOrgId) ? (
                  <>
                    <StyledInput
                      placeholder={trans("branding.logoUrlPlaceholder")}
                      value={brandingConfig?.config_set?.[SettingsEnum.LOGO] || ""}
                      onChange={(e) => updateSettings(SettingsEnum.LOGO, e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                  </>
                ) : (
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
                      {Boolean(brandingConfig?.config_set?.[SettingsEnum.LOGO])
                        ? <img src={buildMaterialPreviewURL(brandingConfig?.config_set?.[SettingsEnum.LOGO]!)} alt="logo" />
                        : uploadButton(loading[SettingsEnum.LOGO])
                      }
                    </Upload>
                  </StyledRectUploadContainer>
                )}
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.LOGO]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/24x24"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
          </Card>
        </StyledBrandingSettingContent>

        {/* Colors and Fonts */}
        <StyledBrandingSettingContent>
          <StyledThemeSettingsCover>
            <StyledCoverTitle>{trans("branding.colorFontSection")}</StyledCoverTitle>
          </StyledThemeSettingsCover>
          <Card>
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.mainBrandingColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.mainBrandingColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.MAIN_BRANDING_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.MAIN_BRANDING_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.editorHeaderColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.appHeaderColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.APP_HEADER_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.APP_HEADER_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.adminSidebarColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.adminSidebarColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ADMIN_SIDEBAR_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.adminSidebarFontColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.adminSidebarFontColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_FONT_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ADMIN_SIDEBAR_FONT_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.adminSidebarActiveBgColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.adminSidebarActiveBgColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_ACTIVE_BG_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ADMIN_SIDEBAR_ACTIVE_BG_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.adminSidebarActiveFontColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.adminSidebarActiveFontColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.ADMIN_SIDEBAR_ACTIVE_FONT_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ADMIN_SIDEBAR_ACTIVE_FONT_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.editorSidebarColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.editorSidebarColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.EDITOR_SIDEBAR_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.editorSidebarFontColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.editorSidebarFontColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_FONT_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.EDITOR_SIDEBAR_FONT_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.editorSidebarActiveBgColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.editorSidebarActiveBgColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_ACTIVE_BG_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.EDITOR_SIDEBAR_ACTIVE_BG_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.editorSidebarActiveFontColor")}</StyledSectionTitle>
                <ColorPicker
                  getPopupContainer={(node: any) => node.parentNode}
                  value={brandingConfig?.config_set?.editorSidebarActiveFontColor}
                  showText
                  allowClear
                  format="hex"
                  onChange={(_, hex) => updateSettings(SettingsEnum.EDITOR_SIDEBAR_ACTIVE_FONT_COLOR, hex)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.EDITOR_SIDEBAR_ACTIVE_FONT_COLOR]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.font")}</StyledSectionTitle>
                <StyledCustomSelect
                  placeholder={trans("style.fontFamily")}
                  options={fonts}
                  value={brandingConfig?.config_set?.font}
                  onChange={(font) => updateSettings(SettingsEnum.FONT, font)}
                />
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.FONT]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
          </Card>
        </StyledBrandingSettingContent>

        {/* Texts and Images for Standard Pages */}
        <StyledBrandingSettingContent>
          <StyledThemeSettingsCover>
            <StyledCoverTitle>{trans("branding.textSection")}</StyledCoverTitle>
          </StyledThemeSettingsCover>
          <Card>
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle>{trans("branding.errorPage")}</StyledSectionTitle>
                <StyledTextArea
                  rows={4}
                  value={brandingConfig?.config_set?.errorPageText || ""}
                  onChange={(e) => updateSettings(SettingsEnum.ERROR_PAGE_TEXT, e.target.value)}
                />

                {/* {!Boolean(configOrgId) ? (
                  <> */}
                    <StyledSectionTitle style={{marginTop : "20px"}}>{trans("branding.errorPageImageUrl")}</StyledSectionTitle>
                    <StyledInput
                      placeholder={trans("branding.errorPageImageUrlPlaceholder")}
                      value={brandingConfig?.config_set?.[SettingsEnum.ERROR_PAGE_IMAGE] || ""}
                      onChange={(e) => updateSettings(SettingsEnum.ERROR_PAGE_IMAGE, e.target.value)}
                    />
                  {/* </>
                ) : (
                  <>
                    <StyledSectionTitle style={{marginTop : "20px"}}>{trans("branding.errorPageImage")}</StyledSectionTitle>
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
                        {Boolean(brandingConfig?.config_set?.[SettingsEnum.ERROR_PAGE_IMAGE])
                          ? <img src={buildMaterialPreviewURL(brandingConfig?.config_set?.[SettingsEnum.ERROR_PAGE_IMAGE]!)} alt="error_page_image" />
                          : uploadButton(loading[SettingsEnum.ERROR_PAGE_IMAGE])
                        }
                      </Upload>
                    </StyledRectUploadContainer>
                  </>
                )} */}
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ERROR_PAGE_TEXT]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
            <StyledDivider />
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <StyledSectionTitle style={{marginTop : "20px"}}>{trans("branding.signUpPage")}</StyledSectionTitle>
                <StyledTextArea
                  rows={4}
                  value={brandingConfig?.config_set?.signUpPageText || ""}
                  onChange={(e) => updateSettings(SettingsEnum.SIGNUP_PAGE_TEXT, e.target.value)}
                />

                {/* {!Boolean(configOrgId) ? (
                  <> */}
                    <StyledSectionTitle style={{marginTop : "20px"}}>{trans("branding.signUpPageImageUrl")}</StyledSectionTitle>
                    <StyledInput
                      placeholder={trans("branding.signUpPageImageUrlPlaceholder")}
                      value={brandingConfig?.config_set?.[SettingsEnum.SIGNUP_PAGE_IMAGE] || ""}
                      onChange={(e) => updateSettings(SettingsEnum.SIGNUP_PAGE_IMAGE, e.target.value)}
                    />
                  {/* </>
                ) : (
                  <>
                    <StyledSectionTitle style={{marginTop : "20px"}}>{trans("branding.signUpPageImage")}</StyledSectionTitle>
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
                        {Boolean(brandingConfig?.config_set?.[SettingsEnum.SIGNUP_PAGE_IMAGE])
                          ? <img src={buildMaterialPreviewURL(brandingConfig?.config_set?.[SettingsEnum.SIGNUP_PAGE_IMAGE]!)} alt="signup_page_image" />
                          : uploadButton(loading[SettingsEnum.SIGNUP_PAGE_IMAGE])
                        }
                      </Upload>
                    </StyledRectUploadContainer>
                  </>
                )} */}
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.ERROR_PAGE_TEXT]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
            <StyledDivider />
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <div style={{marginTop : "20px"}}>
                  <StyledSectionTitle>{trans("branding.standardTitle")}</StyledSectionTitle>
                  <StyledTextArea
                    rows={2}
                    value={brandingConfig?.config_set?.standardTitle || ""}
                    onChange={(e) => updateSettings(SettingsEnum.STANDARD_TITLE, e.target.value)}
                  />
                </div>
                <div style={{marginTop : "20px"}}>
                  <StyledSectionTitle>{trans("branding.standardDescription")}</StyledSectionTitle>
                  <StyledTextArea
                    rows={2}
                    value={brandingConfig?.config_set?.standardDescription || ""}
                    onChange={(e) => updateSettings(SettingsEnum.STANDARD_DESCRIPTION, e.target.value)}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.STANDARD_TITLE]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
          </Card>
        </StyledBrandingSettingContent>

        {/* Helper Links in left submenu */}
        <StyledBrandingSettingContent>
          <StyledThemeSettingsCover>
            <StyledCoverTitle>
              {trans("branding.showDocumentationSection")}
            </StyledCoverTitle>
          </StyledThemeSettingsCover>
          <Card>
            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <div>
                  <StyledSectionTitle>{trans("branding.showDocumentation")}</StyledSectionTitle>
                  <Switch
                    checked={brandingConfig?.config_set?.showDocumentation}
                    onChange={(checked) => updateSettings(SettingsEnum.SHOW_DOCUMENTATION, checked)}
                  />
                </div>
                {brandingConfig?.config_set?.showDocumentation && (
                  <StyledSwitchContainer>
                    <StyledSectionTitle>{trans("branding.documentationLink")}</StyledSectionTitle>
                    <StyledInput
                      placeholder={trans("branding.documentationLinkPlaceholder")}
                      value={brandingConfig?.config_set?.documentationLink || ""}
                      onChange={(e) => updateSettings(SettingsEnum.DOCUMENTATION_LINK, e.target.value)}
                    />
                    <HelpText>{trans("branding.documentationLinkHelp")}</HelpText>
                  </StyledSwitchContainer>
                )}
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.SHOW_DOCUMENTATION]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <div style={{ marginTop: "20px" }}>
                  <StyledSectionTitle>{trans("branding.whatsNew")}</StyledSectionTitle>
                  <Switch
                    checked={brandingConfig?.config_set?.whatsNew}
                    onChange={(checked) => updateSettings(SettingsEnum.WHATS_NEW, checked)}
                  />
                </div>
                {brandingConfig?.config_set?.whatsNew && (
                  <StyledSwitchContainer>
                    <StyledSectionTitle>{trans("branding.whatsNewLink")}</StyledSectionTitle>
                    <StyledInput
                      placeholder={trans("branding.whatsNewLinkPlaceholder")}
                      value={brandingConfig?.config_set?.whatsNewLink || ""}
                      onChange={(e) => updateSettings(SettingsEnum.WHATS_NEW_LINK, e.target.value)}
                    />
                    <HelpText>{trans("branding.whatsNewLinkHelp")}</HelpText>
                  </StyledSwitchContainer>
                )}
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.WHATS_NEW]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>

            <StyledRow gutter={32} align={"middle"} justify={"space-between"}>
              <Col xs={24} md={6}>
                <div style={{marginTop : "20px"}}>
                  <StyledSectionTitle>{trans("branding.submitIssue")}</StyledSectionTitle>
                  <Switch
                    checked={brandingConfig?.config_set?.submitIssue}
                    onChange={(checked) => updateSettings(SettingsEnum.SUBMIT_ISSUE, checked)}
                  />
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Paragraph type="secondary">
                  {settingDescription[SettingsEnum.SUBMIT_ISSUE]}
                </Paragraph>
              </Col>
              <Col xs={24} md={8} style={{textAlign: 'right'}}>
                {/* <StyledImage
                  width={200}
                  height={100}
                  src="https://placehold.co/200x100"
                  alt="Color Preview"
                  preview
                  loading="lazy"
                /> */}
              </Col>
            </StyledRow>
          </Card>
        </StyledBrandingSettingContent>
        
        <StyledButtonContainer gap={10}>
          <TacoButton
            buttonType="delete"
            disabled={!Boolean(brandingConfig?.id)}
            onClick={() => handleDelete(brandingConfig?.id!)}
          >
            {trans("delete")}
          </TacoButton>
          <TacoButton
            buttonType="normal"
            icon={<ResetIcon />}
            disabled={isBrandingNotChange()}
            onClick={() => setBrandingConfig(defaultBrandingConfig)}
          >
            {trans("reset")}
          </TacoButton>
          <TacoButton
            buttonType="primary"
            disabled={isBrandingNotChange()}
            onClick={() => handleSave(brandingConfig)}
          >
            {trans("branding.saveButton")}
          </TacoButton>
        </StyledButtonContainer>
      </DetailContent>
    </DetailContainer>
  );
}
