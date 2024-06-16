import CountUp from 'react-countup';
import { useSelector } from "react-redux";
import styled from "styled-components";
import dayjs from "dayjs";
import { default as AntdBreadcrumb } from "antd/es/breadcrumb";
import { ArrowIcon } from "lowcoder-design";

import { getUser } from "../../redux/selectors/usersSelectors";
import { getCurrentUser } from "../../redux/selectors/usersSelectors";
import { normalAppListSelector } from "../../redux/selectors/applicationSelector";

import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import history from "util/history";
import { trans, languageList } from "../../i18n";
import { ALL_APPLICATIONS_URL } from "constants/routesURL";
import { default as Divider } from "antd/es/divider";

import { Avatar, Button, Card, Col, Row, Space, Typography, Select, Tooltip } from "antd";

import { fullAvatarUrl } from "util/urlUtils";

import {
  BlurFinishInput,
  OtpFormInput, // maybe to use
  PasswordInput, // maybe to use
} from "lowcoder-design";

import {
  ApplicationDocIcon,
  ModuleDocIcon,
  AvatarGroupCompIcon,
} from "lowcoder-design";

import { useDispatch } from "react-redux";
import { beforeImgUpload, getBase64 } from "util/fileUtils";
import { updateUserAction, updateUserSuccess } from "redux/reduxActions/userActions";
import { default as Upload, UploadChangeParam } from "antd/es/upload";
import { USER_HEAD_UPLOAD_URL } from "constants/apiConstants";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import UserApiKeysCard from './components/UserApiKeysCard';

const { Text, Title, Link } = Typography;
const { Option } = Select;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const HeaderWrapper = styled.div`
  height: 84px;
  width: 100%;
  display: flex;
  padding: 0 36px;
  align-items: center;
  flex-shrink: 0;
  @media screen and (max-width: 500px) {
    padding: 0 24px;
  }
`;

const ContentWrapper = styled.div`
  position: relative;
`;

const Breadcrumb = styled(AntdBreadcrumb)`
  font-size: 20px;

  li:not(:last-child) {
    color: #8b8fa3;
  }

  li:last-child {
    font-weight: 500;
    color: #222222;
  }

  li.ant-breadcrumb-separator {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
`;

const BreadcrumbItem = styled.div`
  cursor: pointer;
`;

const ProfileView = styled.div`
  font-size: 14px;
  color: #8b8fa3;
  flex-grow: 1;
  padding-top: 00px;
  padding-left: 40px;
  max-width: 95%;
`;

const StyleProfileCover = styled.div`
    background: rgb(2,0,36);
    background: -moz-linear-gradient(31deg, rgba(2,0,36,1) 0%, rgba(121,9,102,1) 35%, rgba(0,212,255,1) 100%);
    background: -webkit-linear-gradient(31deg, rgba(2,0,36,1) 0%, rgba(121,9,102,1) 35%, rgba(0,212,255,1) 100%);
    background: linear-gradient(31deg, rgba(2,0,36,1) 0%, rgba(121,9,102,1) 35%, rgba(0,212,255,1) 100%);
    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#020024",endColorstr="#00d4ff",GradientType=1);
    padding: 25px;
    height: 120px;
    border-radius:10px 10px 0 0;
`;

const StyleProfileContent = styled.div` 
    position: relative;
    margin-top:-50px;
    display: flex;
    align-items: end;
    gap: 20px;

    .subtitle {
        color: #8b8fa3;
    }

    .button-end {
        margin-left: auto;
    }
    
    svg {
        margin-right: 5px;
        vertical-align: middle;
    }
`;

const StyleAvatar = styled(Avatar)`
  position: relative;
  border: 3px solid #eee;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  background-color: #0093E9;
  background-image: linear-gradient(160deg, #0093E9 0%, #80D0C7 100%);
  .ant-avatar-string {
    font-size: 2em;
  }
`;

const TextMuted = styled.div`
    color: "#8b8fa3";
`;

const BgSuccess = styled.div`
      background-color: #f0f2f5;
`;

export type UserProfileBreadcrumbType = { text: string; path: string };

export type UserProfileLayoutMode = "view" | "trash" | "module" | "folder" | "folders" | "marketplace";

export interface UserProfileLayoutProps {
  breadcrumb?: UserProfileBreadcrumbType[];
}

const getInitials = (name: string) => {
  const initials = name.split(' ').map(word => word[0]).join('');
  return initials.toUpperCase();
};

export function UserProfileLayout(props: UserProfileLayoutProps) {

  const { breadcrumb = []} = props;
  const user = useSelector(getUser);
  const currentUser = useSelector(getCurrentUser);
  const apps = useSelector(normalAppListSelector);  
  const currentOrgId = user.currentOrgId;

  const currentOrg = useMemo(
    () => user.orgs.find((o) => o.id === currentOrgId),
    [user, currentOrgId]
  );

  const currentPath = useLocation().pathname;
  const dispatch = useDispatch();

  const handleUploadChange = (info: UploadChangeParam) => {
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj, (imageUrl: string) => {
        dispatch(updateUserSuccess({ avatarUrl: imageUrl }));
      });
    }
    if (info.file.status === "error") {
      messageInstance.error(trans("profile.uploadError"));
    }
  };

  // persist the language change to the user
  const handleLanguageChange = (newLanguage: string) => {
    // using localStorage, so that the language is persisted across sessions
    // especially since the translator function is global and outside of a react state
    dispatch(updateUserAction({ uiLanguage: newLanguage }));
    localStorage.setItem('lowcoder_uiLanguage',newLanguage);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  if (!user.currentOrgId) {
    return null;
  }

  const breadcrumbItems = [
    {
      key: 0,
      title: trans("home.home"),
      onClick: () =>
        currentPath !== ALL_APPLICATIONS_URL && history.push(ALL_APPLICATIONS_URL),
    },
    ...breadcrumb.map((b, i) => ({
      key: i+1,
      title: b.text,
      onClick: () => currentPath !== b.path && history.push(b.path)
    }))
  ]

  return (
    <Wrapper>
      <HeaderWrapper>
        <Breadcrumb
          separator={<ArrowIcon />}
          items={breadcrumbItems}
          itemRender={(item) => (
            <BreadcrumbItem
              key={item.key}
              onClick={item.onClick}
            >
              {item.title}
            </BreadcrumbItem>
          )}
        >
        </Breadcrumb>
      </HeaderWrapper>

      <ContentWrapper>
        <ProfileView>
          <StyleProfileCover>
          </StyleProfileCover>
          <Card style={{ marginBottom: "20px" }}>
            <StyleProfileContent>
              <Row gutter={[24, 24]} style={{ display: 'flex', alignItems: 'end' }}>
                <Col lg={4}>
                  {user.avatarUrl ? (
                    <StyleAvatar src={fullAvatarUrl(user.avatarUrl)} shape="square" size={120} />
                  ) : (
                    <StyleAvatar shape="square" size={120}>
                      {getInitials(user.username)}
                    </StyleAvatar>
                  )}
                </Col>
                <Col lg={20}>
                  <Space style={{paddingLeft : "80px"}}>
                    <div>
                      <Title level={4} style={{ marginBottom: '10px'}}>{user.username}</Title>
                      <Space className='subtitle' size={15} style={{ marginRight: '20px', gap: '8px', marginBottom: '10px' }}>
                          <div>{currentUser.email}</div>
                      </Space>
                    </div>
                  </Space>
                </Col>
              </Row>
            </StyleProfileContent>

            <Divider />

            <Space wrap>
              <Upload
                accept="image/*"
                showUploadList={false}
                action={USER_HEAD_UPLOAD_URL}
                onChange={handleUploadChange}
                beforeUpload={beforeImgUpload}
                withCredentials
              >
                <Tooltip placement="topLeft" title={ trans("profile.changeAvatarTooltip")}>
                  <Button style={{marginTop: "8px"}}>
                    {trans("profile.changeAvatar")}
                  </Button>
                  </Tooltip>
              </Upload>

              <Tooltip placement="topLeft" title={ trans("profile.saveUserNameTooltip")}>
                <div>
                  <BlurFinishInput
                    valueCheck={{
                      rule: (val) => val.trim() !== "",
                      message: trans("profile.nameCheck"),
                    }}
                    placeholder={trans("profile.namePlaceholder")}
                    defaultValue={user.username}
                    onFinish={(value: string) => {
                      dispatch(updateUserAction({ name: value }));
                    }}
                  />
                </div>
              </Tooltip>
            </Space>

          </Card>

          <Card style={{ marginBottom: "20px" }}>
            <Title level={4}>{trans("profile.about")}</Title>
            <Space direction="horizontal" size={10} wrap={true}>
              <Text>{trans("profile.userId")}: {user.id}</Text> | 
              <Text>{trans("profile.createdAt")}: {dayjs(user.createdTimeMs).format("YYYY-MM-DD HH:mm:ss")}</Text> | 
              <Text>{trans("profile.currentOrg")}: {currentOrg?.name}</Text>
            </Space>
          </Card>

          <Card style={{ marginBottom: "20px" }}>
            <Title level={4}>{trans("profile.settings")}</Title>
            <Space direction="vertical" size={10}>
              <Text>{trans("profile.uiLanguage")}:</Text>
              <Select
                defaultValue={currentUser.uiLanguage ?? 'en'}
                style={{ width: 200 }}
                onChange={handleLanguageChange}
                showSearch
              >
                {languageList.map(lang => (
                  <Option key={lang.languageCode} value={lang.languageCode}>
                    <Space>
                      <lang.flag width={"16px"}/>
                      {lang.languageName}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Space>
          </Card>

          { user.orgDev && 
            <UserApiKeysCard />
          }

          <Card style={{ marginBottom: "20px" }}>
            <Title level={4}>{trans("profile.info")}</Title>
            <Space direction="horizontal" size={10}>
              <Row gutter={[24,24]}>
                <Col xs={24} sm={12} xl={6} style={{marginBottom: "20px", minWidth: "350px"}} span={8}>
                    <Card hoverable extra={<a href="#" onClick={() => history.replace(ALL_APPLICATIONS_URL)}>{trans("home.show")}</a>}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ textTransform: "uppercase", fontSize: "13px" }}>
                                  {trans("profile.createdApps")}
                                </p>
                                <h4 style={{ fontSize: "22px" }}>
                                    <span data-target={apps.filter(app => app.createBy === user.username && app.applicationType == 1).length}>
                                      <CountUp start={0} end={apps.filter(app => app.createBy === user.username && app.applicationType == 1).length} duration={2} />
                                    </span>
                                </h4>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <h5 style={{ color: "#55c27f", marginRight: "50px" }}></h5>
                                </div>
                            </div>
                            <BgSuccess style={{ padding: '6px', width: '48px', height: '48px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ApplicationDocIcon width={"42px"}/>
                            </BgSuccess>
                        </div>
                    </Card>
                </Col>
                <Col  xs={24} sm={12} xl={6} style={{marginBottom: "20px", minWidth: "350px"}} flex="auto" span={8}>
                    <Card hoverable extra={<a href="#" onClick={() => history.replace(ALL_APPLICATIONS_URL)}>{trans("home.show")}</a>}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ textTransform: "uppercase", fontSize: "13px" }}>
                                  {trans("profile.createdModules")}
                                </p>
                                <h4 style={{ fontSize: "22px" }}>
                                    <span data-target={apps.filter(app => app.createBy === user.username && app.applicationType == 2).length}>
                                        <CountUp start={0} end={apps.filter(app => app.createBy === user.username && app.applicationType == 2).length} duration={2} />
                                    </span>
                                </h4>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <h5 style={{ color: "#55c27f", marginRight: "50px" }}></h5>
                                </div>
                            </div>
                            <BgSuccess style={{ padding: '6px', width: '48px', height: '48px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ModuleDocIcon width={"42px"}/>
                            </BgSuccess>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} sm={12} xl={6} style={{marginBottom: "20px", minWidth: "350px"}} span={8}>
                    <Card hoverable extra={<a href="#" onClick={() => history.replace(ALL_APPLICATIONS_URL)}>{trans("home.show")}</a>}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ textTransform: "uppercase", fontSize: "13px" }}>
                                  {trans("profile.sharedApps")}
                                </p>
                                <h4 style={{ fontSize: "22px" }}>
                                    <span data-target={apps.filter(app => app.createBy !== user.username && app.applicationType == 1).length}>
                                      <CountUp start={0} end={apps.filter(app => app.createBy !== user.username && app.applicationType == 1).length} duration={2} />
                                    </span>
                                </h4>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <h5 style={{ color: "#55c27f", marginRight: "50px" }}></h5>
                                </div>
                            </div>
                            <BgSuccess style={{ padding: '6px', width: '48px', height: '48px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ApplicationDocIcon width={"42px"}/>
                            </BgSuccess>
                        </div>
                    </Card>
                </Col>
                <Col  xs={24} sm={12} xl={6} style={{marginBottom: "20px", minWidth: "350px"}} flex="auto" span={8}>
                    <Card hoverable extra={<a href="#" onClick={() => history.replace(ALL_APPLICATIONS_URL)}>{trans("home.show")}</a>}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ textTransform: "uppercase", fontSize: "13px" }}>
                                  {trans("profile.sharedModules")}
                                </p>
                                <h4 style={{ fontSize: "22px" }}>
                                    <span data-target={apps.filter(app => app.createBy !== user.username && app.applicationType == 2).length}>
                                        <CountUp start={0} end={apps.filter(app => app.createBy !== user.username && app.applicationType == 2).length} duration={2} />
                                    </span>
                                </h4>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <h5 style={{ color: "#55c27f", marginRight: "50px" }}></h5>
                                </div>
                            </div>
                            <BgSuccess style={{ padding: '6px', width: '48px', height: '48px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ModuleDocIcon width={"42px"}/>
                            </BgSuccess>
                        </div>
                    </Card>
                </Col>
                
                <Col  xs={24} sm={12} xl={6} style={{marginBottom: "20px", minWidth: "300px"}} flex="auto" span={8}>
                    <Card hoverable>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <div>
                                <p style={{ textTransform: "uppercase", fontSize: "13px" }}>
                                  {trans("profile.memberOfOrgs")}
                                </p>
                                <h4 style={{ fontSize: "22px" }}>
                                    <span data-target={user.orgs.length}>
                                        <CountUp start={0} end={user.orgs.length} duration={2} />
                                    </span>
                                </h4>
                            </div>
                            <BgSuccess style={{ padding: '6px', width: '48px', height: '48px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AvatarGroupCompIcon width={"42px"}/>
                            </BgSuccess>
                        </div>
                    </Card>
                </Col>
                
                
            </Row>


            </Space>
          </Card>
          
          
          
        </ProfileView>
      </ContentWrapper>
    </Wrapper>
  );
}
