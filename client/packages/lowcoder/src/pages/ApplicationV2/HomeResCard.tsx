import { TacoButton, CustomModal, Alert } from "lowcoder-design"
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateAppMetaAction } from "redux/reduxActions/applicationActions";
import styled from "styled-components";
import { timestampToHumanReadable } from "util/dateTimeUtils";
import { HomeRes } from "./HomeLayout";
import { HomeResTypeEnum } from "../../types/homeRes";
import { updateFolder } from "../../redux/reduxActions/folderActions";
import {
  backFolderViewClick,
  handleAppEditClick,
  handleAppViewClick,
  handleFolderViewClick,
  handleMarketplaceAppViewClick,
  HomeResInfo,
} from "../../util/homeResUtils";
import { HomeResOptions } from "./HomeResOptions";
import { trans } from "../../i18n";
import { checkIsMobile } from "util/commonUtils";
import history from "util/history";
import { APPLICATION_VIEW_URL } from "constants/routesURL";
import { TypographyText } from "../../components/TypographyText";
import { useParams } from "react-router-dom";
import {FolderIcon} from "icons";
import { BrandedIcon } from "@lowcoder-ee/components/BrandedIcon";
import { Typography } from "antd";
import { default as Form } from "antd/es/form";
import { default as Input } from "antd/es/input";
import { default as AntdTypographyText } from "antd/es/typography/Text";
import { MultiIconDisplay } from "@lowcoder-ee/comps/comps/multiIconDisplay";
import { FormStyled } from "../setting/idSource/styledComponents";

const ExecButton = styled(TacoButton)`
  width: 52px;
  height: 24px;
  padding: 5px 12px;
  margin-right: 24px;
  background: #fafbff;
  border: 1px solid #c9d1fc;
  border-radius: 4px;
  font-weight: 500;
  color: #4965f2;

  &:hover {
    background: #f9fbff;
    border: 1px solid #c2d6ff;
    color: #315efb;
  }

  @media screen and (max-width: 500px) {
    margin-right: 0;
    display: none;
  }
`;

const Wrapper = styled.div`
  padding: 0 6px;
  border-radius: 8px;
  margin-bottom: 2px;
  margin-top: 2px;
  padding-top: 10px;
  padding-bottom: 10px;
  background-color: #fcfcfc;
  min-height: 100px;
  &:hover {
     background-color: #f5f5f6
  }
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  width: 100%;
  
  padding: 0 10px;

  button {
    opacity: 0;
  }

  &:hover {
    button {
      opacity: 1;
    }
  }

  @media screen and (max-width: 500px) {
    button {
      opacity: 1;
    }

    padding: 0;
  }
`;

const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 14px;
  white-space: nowrap;
  width: 30%;
  height: 100%;
  flex-grow: 1;
  cursor: pointer;
  padding-right: 12px;

  .ant-typography {
    padding: 2px 2px 8px 2px;
  }
`;

const AppTimeOwnerInfoLabel = styled.div`
  font-size: 13px;
  color: #8b8fa3;
  line-height: 15px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  padding-right: 10px;
  @media screen and (max-width: 500px) {
    > svg {
      display: none;
    }
  }
`;

export const StyledTypographyText = styled(AntdTypographyText)`
  font-size: 14px;
  color: #333333;
  line-height: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;

  &:hover {
  color: #315efb;
  }
  }
`;

const MONTH_MILLIS = 30 * 24 * 60 * 60 * 1000;

interface UpdateAppModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (values: any) => void;
  res: HomeRes;
  folderId?: string;
}

export function UpdateAppModal({ visible, onCancel, onOk, res, folderId }: UpdateAppModalProps) {
  const [detailsForm] = Form.useForm();

  // Reset form values when res changes
  useEffect(() => {
    if (res && visible) {
      detailsForm.setFieldsValue({
        appName: res.name,
        title: res.title
      });
    }
  }, [res, visible, detailsForm]);

  return (
    <CustomModal
      title={trans("home.updateAppName")}
      open={visible}
      destroyOnHidden
      onCancel={onCancel}
      showCancelButton={false}
      showOkButton
      width="440px"
      okText={trans("finish")}
      onOk={() => {
        detailsForm.validateFields().then((values) => {
          onOk(values);
        }).catch((errorInfo) => {
          console.error('Validation failed:', errorInfo);
        });
      }}
    >
      <FormStyled
        form={detailsForm}
        name="general"
        layout="vertical"
        style={{ maxWidth: '100%' }}
        autoComplete="off"
      >
        {res.title && 
          <Alert label={trans("home.titleUpdateWarning")} type="warning" />}
        <br/>

        <Form.Item label={trans("home.name")} name="appName">
          <Input/>
        </Form.Item>

        {res.title && (
          <Form.Item label={trans("title")} name="title">
            <Input disabled />
          </Form.Item>
        )}

      </FormStyled>
    </CustomModal>
  );
}

export function HomeResCard(props: { res: HomeRes; onMove: (res: HomeRes) => void; setModify:any; modify: boolean }) {
  const { res, onMove, setModify, modify } = props;
  const [dialogVisible, setDialogVisible] = useState(false)
  const dispatch = useDispatch();

  const { folderId } = useParams<{ folderId: string }>();

  const subTitle = trans("home.resCardSubTitle", {
    time: timestampToHumanReadable(res.lastModifyTime, MONTH_MILLIS),
    creator: res.creator,
  });

  const resInfo = HomeResInfo[res.type];

  if (!resInfo) {
    return null;
  }

  var iconColor = "#444";
  if (res.type === HomeResTypeEnum.Application) {
    iconColor = "#2650cf";
  }
  else if (res.type === HomeResTypeEnum.Module) {
    iconColor = "#cf9e26";
  }
  else if (res.type === HomeResTypeEnum.NavLayout || res.type === HomeResTypeEnum.MobileTabLayout) {
    iconColor = "#af41ff";
  }
  const Icon = resInfo.icon;

  const handleModalOk = (values: any) => {
    res.type === HomeResTypeEnum.Folder &&
      dispatch(updateFolder({ id: res.id, name: values.appName || res.name }))
    dispatch(
      updateAppMetaAction({ applicationId: res.id, name: values.appName || res.name, folderId: folderId })
    );
    
    setDialogVisible(false);
    setTimeout(() => {
      setModify(!modify);
    }, 200);
  };

  return (
    <>
      <UpdateAppModal
        visible={dialogVisible}
        onCancel={() => setDialogVisible(false)}
        onOk={handleModalOk}
        res={res}
        folderId={folderId}
      />

      <Wrapper>
        <Card>
          {res.icon ? 
            <MultiIconDisplay 
            identifier={res.icon && typeof res.icon === 'string' ? res.icon : '/icon:antd/appstoreoutlined'} 
            width="30px" 
            height="30px" 
            style={{ 
              marginRight: "6px", 
              flexShrink: 0, 
              color: "#b766db" 
              }} 
            /> :
            Icon && (
              <BrandedIcon>
                <Icon width={"42px"} height={"42px"} style={
                  { 
                    color: iconColor,
                    marginRight: "10px", 
                    flexShrink: 0 
                  }
                } />
              </BrandedIcon>
            )
          }
          <CardInfo
            onClick={(e) => {
              if (res.type === HomeResTypeEnum.Folder) {
                handleFolderViewClick(res.id);
              } else {
                if (checkIsMobile(window.innerWidth)) {
                  history.push(APPLICATION_VIEW_URL(res.id, "view"));
                  return;
                }
                if(res.isMarketplace) {
                  handleMarketplaceAppViewClick(res.id);
                  return;
                }
                res.isEditable ? handleAppEditClick(e, res.id) : handleAppViewClick(res.id);
              }
            }}
          >
            <StyledTypographyText> 
              {res.title || res.name}
            </StyledTypographyText>

            {res?.description 
              && <Typography.Text 
                  type="secondary" 
                  style={{ fontSize: 12, textWrap: "wrap"}}
                  >
                {res.description.length > 150 ? res.description.substring(0, 150) + '...' : res.description}
            </Typography.Text>}

            <AppTimeOwnerInfoLabel title={subTitle}>{subTitle}</AppTimeOwnerInfoLabel>
          </CardInfo>
          <OperationWrapper>
            {/* {res.isEditable && (
              <EditButton onClick={(e) => handleAppEditClick(e, res.id)} buttonType="primary">
                {trans("edit")}
              </EditButton>
            )} */}
            <ExecButton
              onClick={() =>
                res.type === HomeResTypeEnum.Folder
                  ? handleFolderViewClick(res.id)
                  : res.isMarketplace
                  ? handleMarketplaceAppViewClick(res.id)
                  : handleAppViewClick(res.id)
              }
            >
              {trans("view")}
            </ExecButton>
            <HomeResOptions
              res={res}
              onRename={() => setDialogVisible(true)}
              onMove={(res) => onMove(res)}
              setModify={setModify}
              modify={modify}
            />
          </OperationWrapper>
        </Card>
      </Wrapper>
    </>
  );
}

export function Back(props: { mode: string }) {
  const { mode } = props;
  return mode === "folder" ?
      <Wrapper style={{cursor: "pointer"}}>
        <Card>
          <FolderIcon width={"42px"} height={"42px"} style={
            {
              marginRight: "10px",
              flexShrink: 0
            }
          } />
          <CardInfo
              onClick={(e) => {
                backFolderViewClick();
              }}
          >
            <TypographyText
            />
            <h1 style={{fontSize:"x-large"}}>...</h1>
            <AppTimeOwnerInfoLabel title={""}></AppTimeOwnerInfoLabel>
          </CardInfo>
        </Card>
      </Wrapper>
      : <></>;
}