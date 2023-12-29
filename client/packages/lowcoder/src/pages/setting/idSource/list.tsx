import React, { useEffect, useState } from "react";
import { trans } from "i18n";
import {
  Level1SettingPageContentWithList,
  Level1SettingPageTitleWithBtn,
} from "pages/setting/styled";
import Column from "antd/lib/table/Column";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import IdSourceApi, { ConfigItem } from "api/idSourceApi";
import {
  authConfig,
  AuthType,
  authTypeDisabled,
  IdSource,
} from "@lowcoder-ee/pages/setting/idSource/idSourceConstants";
import {
  SpanStyled,
  StatusSpan,
  TableStyled,
  CreateButton,
} from "pages/setting/idSource/styledComponents";
import FreeLimitTag from "pages/common/freeLimitTag";
import history from "util/history";
import { OAUTH_PROVIDER_DETAIL } from "constants/routesURL";
import { selectSystemConfig } from "redux/selectors/configSelectors";
import { isEnterpriseMode, isSelfDomain } from "util/envUtils";
import { Badge } from "antd";
import { validateResponse } from "api/apiUtils";
import { ServerAuthTypeInfo } from "@lowcoder-ee/constants/authConstants";
import { GeneralLoginIcon } from "assets/icons";
import { FreeTypes } from "pages/setting/idSource/idSourceConstants";
import { messageInstance, AddIcon } from "lowcoder-design";
import { currentOrgAdmin } from "../../../util/permissionUtils";
import CreateModal from "./createModal";
import _ from "lodash";
import { HelpText } from "components/HelpText";

export const IdSourceList = (props: any) => {
  const user = useSelector(getUser);
  const config = useSelector(selectSystemConfig);
  const { currentOrgId}  = user;
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const enableEnterpriseLogin = useSelector(selectSystemConfig)?.featureFlag?.enableEnterpriseLogin;

  let protocol = window.location.protocol;
  const port = window.location.port;
  let currentDomain = window.location.hostname;

  // Show port only if it is not a standard port
  if (port && port !== '80' && port !== '443') {
    currentDomain += `:${port}`;
  }

  const loginUrl = `${protocol}//${currentDomain}/org/${currentOrgId}/auth/login`;

  useEffect(() => {
    if (!currentOrgId) {
      return;
    }
    getConfigs();
  }, [currentOrgId]);
  
  if (!currentOrgId) {
    return null;
  }

  const getConfigs = () => {
    setFetching(true);
    IdSourceApi.getConfigs()
      .then((resp) => {
        if (validateResponse(resp)) {
          let res: ConfigItem[] = resp.data.data.filter((item: ConfigItem) =>
            IdSource.includes(item.authType)
          );
          res = _.uniqBy(res, 'authType');
          setConfigs(res);
        }
      })
      .catch((e) => {
        messageInstance.error(e.message);
      })
      .finally(() => {
        setFetching(false);
      });
  };

  return (
    <>
      <Level1SettingPageContentWithList>
        <Level1SettingPageTitleWithBtn>
          {trans("idSource.title")}
          {currentOrgAdmin(user) && (
            <CreateButton
              type="primary"
              icon={<AddIcon />}
              onClick={() =>
                setModalVisible(true)
              }
            >
              {"Add OAuth Provider"}
            </CreateButton>
          )}
        </Level1SettingPageTitleWithBtn>
        <TableStyled
          tableLayout={"auto"}
          scroll={{ x: "100%" }}
          pagination={false}
          rowKey="id"
          loading={fetching}
          dataSource={configs}
          rowClassName={(record, index) => {
            return authTypeDisabled((record as ConfigItem).authType, enableEnterpriseLogin)
              ? "row-disabled"
              : "";
          }}
          onRow={(record) => ({
            onClick: () => {
              if (authTypeDisabled((record as ConfigItem).authType, enableEnterpriseLogin)) {
                return;
              }
              history.push({
                pathname: OAUTH_PROVIDER_DETAIL,
                state: record,
              });
            },
          })}
        >
          <Column
            title={trans("idSource.loginType")}
            dataIndex="authType"
            key="authType"
            render={(value, record: ConfigItem) => (
              <SpanStyled disabled={authTypeDisabled(value, enableEnterpriseLogin)}>
                {
                  <img
                    src={ServerAuthTypeInfo[value as AuthType]?.logo || GeneralLoginIcon}
                    alt={value}
                  />
                }
                <span>{authConfig[value as AuthType].sourceName}</span>
                {!FreeTypes.includes(value) && (
                  <FreeLimitTag
                    text={
                      enableEnterpriseLogin ? trans("idSource.payUserTag") : trans("idSource.pay")
                    }
                  />
                )}
              </SpanStyled>
            )}
          />
          <Column
            title={trans("idSource.status")}
            dataIndex="enable"
            key="enable"
            render={(value, record: ConfigItem) => (
              <StatusSpan>
                {value ? (
                  <Badge status="success" text={trans("idSource.enable")} />
                ) : (
                  <Badge status="default" text={trans("idSource.unEnable")} />
                )}
              </StatusSpan>
            )}
          />
        </TableStyled>

        <div style={{ marginTop: 20, marginLeft: 12 }} className="section-title">{trans("advanced.AuthOrgTitle")}</div>
        <HelpText style={{ marginBottom: 12, marginLeft: 12 }}>{trans("advanced.AuthOrgDescrition") + ": "}</HelpText>
        <HelpText style={{ marginBottom: 12, marginLeft: 12 }}><a href={loginUrl} target="blank">{loginUrl}</a></HelpText> 

      </Level1SettingPageContentWithList>
      <CreateModal
        modalVisible={modalVisible}
        oauthProvidersList={configs.map(config => config.authType)}
        closeModal={() => setModalVisible(false)}
        onConfigCreate={() => {
          setModalVisible(false);
          getConfigs();
        }}
      />
    </>
  );
};

