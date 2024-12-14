import { EmptyContent } from "components/EmptyContent";
import { HelpText } from "components/HelpText";
import { Upload, Switch, Card, Input, message, Divider } from "antd";
import { TacoButton, CustomSelect } from "lowcoder-design";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
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

const { TextArea } = Input;

interface BrandingSettings {
    logo: File | null;
    squareLogo: File | null;
    mainBrandingColor: string;
    editorHeaderColor: string;
    adminSidebarColor: string;
    editorSidebarColor: string;
    font: string;
    errorPageText: string;
    errorPageImage: File | null;
    signUpPageText: string;
    signUpPageImage: File | null;
    loggedOutPageText: string;
    loggedOutPageImage: File | null;
    standardDescription: string;
    standardTitle: string;
    showDocumentation: boolean;
    documentationLink: string | null;
    submitIssue: boolean;
    whatsNew: boolean;
    whatsNewLink: string | null;
}

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

const getBase64 = (file: RcFile, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(file);
};
  
const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG files!");
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
  const [settings, setSettings] = useState<BrandingSettings>({
    logo: null,
    squareLogo: null,
    mainBrandingColor: "#FF5733",
    editorHeaderColor: "#4287f5",
    adminSidebarColor: "#2e2e2e",
    editorSidebarColor: "#f4f4f4",
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
  });

  const handleSave = (key: keyof BrandingSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const [logo, setLogo] = useState<string | null>(null);
  const [squareLogo, setSquareLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [loadingSquareLogo, setLoadingSquareLogo] = useState(false);
  const [errorPageImage, setErrorPageImage] = useState<string | null>(null);
  const [signUpPageImage, setSignUpPageImage] = useState<string | null>(null);
  const [loggedOutPageImage, setLoggedOutPageImage] = useState<string | null>(null);
  const [loadingErrorPage, setLoadingErrorPage] = useState(false);
  const [loadingSignUpPage, setLoadingSignUpPage] = useState(false);
  const [loadingLoggedOutPage, setLoadingLoggedOutPage] = useState(false);


  const handleImageChange =
  (setImage: React.Dispatch<React.SetStateAction<string | null>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) =>
  (info: UploadChangeParam) => {
    if (info.file.status === "uploading") {
      setLoading(true);
    return;
    }
    if (info.file.status === "done" && info.file.originFileObj) {
      getBase64(info.file.originFileObj as RcFile, (url) => {
      setLoading(false);
      setImage(url);
    });
    }
  };

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
                  onChange={handleImageChange(setLogo, setLoadingLogo)}
                  maxCount={1}
                >
                  {logo ? <img src={logo} alt="logo" /> : uploadButton(loadingLogo)}
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
                  onChange={handleImageChange(setSquareLogo, setLoadingSquareLogo)}
                  maxCount={1}
                >
                  {squareLogo ? <img src={squareLogo} alt="square-logo" /> : uploadButton(loadingSquareLogo)}
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
                defaultValue={settings.mainBrandingColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => handleSave("mainBrandingColor", hex)}
              />
              <HelpText>{trans("branding.mainBrandingColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorHeaderColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                defaultValue={settings.editorHeaderColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => handleSave("editorHeaderColor", hex)}
              />
              <HelpText>{trans("branding.editorHeaderColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.adminSidebarColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                defaultValue={settings.adminSidebarColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => handleSave("adminSidebarColor", hex)}
              />
              <HelpText>{trans("branding.adminSidebarColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.editorSidebarColor")}</h3>
              <ColorPicker
                getPopupContainer={(node: any) => node.parentNode}
                defaultValue={settings.editorSidebarColor}
                showText
                allowClear
                format="hex"
                onChange={(_, hex) => handleSave("editorSidebarColor", hex)}
              />
              <HelpText>{trans("branding.editorSidebarColorHelp")}</HelpText>
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.font")}</h3>
              <CustomSelect
                options={[] /* Dynamically populate Google Fonts */}
                value={settings.font}
                onChange={(font) => handleSave("font", font)}
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
                onChange={(e) => handleSave("errorPageText", e.target.value)}
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
                  onChange={handleImageChange(setErrorPageImage, setLoadingErrorPage)}
                  maxCount={1}
                >
                  {errorPageImage ? <img src={errorPageImage} alt="errorPage" /> : uploadButton(loadingErrorPage)}
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div>
              <h3 style={{marginTop : "20px"}}>{trans("branding.signUpPage")}</h3>
              <TextArea
                rows={4}
                value={settings.signUpPageText || ""}
                onChange={(e) => handleSave("signUpPageText", e.target.value)}
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
                  onChange={handleImageChange(setSignUpPageImage, setLoadingSignUpPage)}
                  maxCount={1}
                >
                  {signUpPageImage ? <img src={signUpPageImage} alt="signUpPage" /> : uploadButton(loadingSignUpPage)}
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div>
              <h3 style={{marginTop : "20px"}}>{trans("branding.loggedOutPage")}</h3>
              <TextArea
                rows={4}
                value={settings.loggedOutPageText || ""}
                onChange={(e) => handleSave("loggedOutPageText", e.target.value)}
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
                  onChange={handleImageChange(setLoggedOutPageImage, setLoadingLoggedOutPage)}
                  maxCount={1}
                >
                  {loggedOutPageImage ? <img src={loggedOutPageImage} alt="loggedOutPage" /> : uploadButton(loadingLoggedOutPage)}
                </Upload>
              </StyledRectUploadContainer>
            </div>
            <Divider />
            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.standardDescription")}</h3>
              <TextArea
                rows={2}
                value={settings.standardDescription || ""}
                onChange={(e) => handleSave("standardDescription", e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.standardTitle")}</h3>
              <TextArea
                rows={2}
                value={settings.standardTitle || ""}
                onChange={(e) => handleSave("standardTitle", e.target.value)}
                style={{ marginBottom: 12 }}
              />
            </div>

            <div style={{marginTop : "20px"}}>
              <h3>{trans("branding.submitIssue")}</h3>
              <Switch
                checked={settings.submitIssue}
                onChange={(checked) => handleSave("submitIssue", checked)}
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
                onChange={(checked) => handleSave("showDocumentation", checked)}
              />
            </div>
            {settings.showDocumentation && (
              <div style={{ marginTop: "20px" }}>
                <h3>{trans("branding.documentationLink")}</h3>
                <Input
                  placeholder={trans("branding.documentationLinkPlaceholder")}
                  value={settings.documentationLink || ""}
                  onChange={(e) => handleSave("documentationLink", e.target.value)}
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
                onChange={(checked) => handleSave("whatsNew", checked)}
              />
            </div>
            {settings.whatsNew && (
              <div style={{ marginTop: "20px" }}>
                <h3>{trans("branding.whatsNewLink")}</h3>
                <Input
                  placeholder={trans("branding.whatsNewLinkPlaceholder")}
                  value={settings.whatsNewLink || ""}
                  onChange={(e) => handleSave("whatsNewLink", e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <HelpText>{trans("branding.whatsNewLinkHelp")}</HelpText>
              </div>
            )}
          </Card>

        </BrandingSettingContent>

        <TacoButton
          onClick={() => console.log("Settings saved:", settings)}
          style={{ marginTop: 20 }}
        >
          {trans("branding.saveButton")}
        </TacoButton>
      </DetailContent>
    </DetailContainer>
  );
}
