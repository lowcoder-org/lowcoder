import { getApiKeys } from "redux/selectors/usersSelectors";
import Card from "antd/es/card";
import Flex from "antd/es/flex";
import Title from "antd/es/typography/Title";
import Table from "antd/es/table";
import Tooltip from "antd/es/tooltip";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { styled } from "styled-components";
import { AddIcon, CustomModal, EditPopover, TacoButton, messageInstance } from "lowcoder-design";
import { trans } from "i18n";
import { PopoverIcon } from "pages/setting/permission/styledComponents";
import CreateApiKeyModal from "./CreateApiKeyModal";
import { fetchApiKeysAction } from "redux/reduxActions/userActions";
import UserApi from "@lowcoder-ee/api/userApi";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";

const TableStyled = styled(Table)`
  .ant-table-tbody > tr > td {
    padding: 11px 12px;
  }
`;

const OperationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`;

const CreateButton = styled(TacoButton)`
  svg {
    margin-right: 2px;
    width: 12px;
    height: 12px;
  }

  box-shadow: none;
`;

export default function UserApiKeysCard() {
  const dispatch = useDispatch();
  const apiKeys = useSelector(getApiKeys);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      messageInstance.success('Copied to clipboard!');
    }).catch(err => {
      messageInstance.error('Failed to copy!');
    });
  };

  return (
    <>
      <Card style={{ marginBottom: "20px" }}>
        <Flex justify="space-between" align="center" style={{marginBottom: '8px'}}>
          <Title level={4}>{trans("profile.apiKeys")}</Title>
          <h4><a href={trans("docUrls.apiDocHome")} target="_blank">{trans("home.howToUseAPI")}</a></h4>
          <CreateButton
            buttonType={"primary"}
            icon={<AddIcon />}
            onClick={() =>
              setModalVisible(true)
            }
          >
            {trans("profile.createApiKey")}
          </CreateButton>
        </Flex>
        <TableStyled
          tableLayout={"auto"}
          scroll={{ x: "100%" }}
          pagination={false}
          onRow={(record) => ({
            
          })}
          columns={[
            {
              title: trans("profile.apiKeyName"),
              dataIndex: "name",
              ellipsis: true,
            },
            {
              title: trans("profile.apiKeyDescription"),
              dataIndex: "description",
              ellipsis: true,
              render: (value: string) => {
                return (
                  <>
                    { value || '-'}
                  </>
                )
              }
            },
            {
              title: trans("profile.apiKey"),
              dataIndex: "token",
              ellipsis: true,
              render: (value: string) => {
                const startToken = value.substring(0, 6);
                const endToken = value.substring(value.length - 6);
                return (
                  <Tooltip placement="topLeft" title={ trans("profile.apiKeyCopy")}>
                    <div onClick={() => handleCopy(value)} style={{ cursor: 'pointer' }}>
                      {`${startToken}********************${endToken}`}
                    </div>
                  </Tooltip>
                )
              }
            },
            { title: " ", dataIndex: "operation", width: "208px" },
          ]}
          dataSource={apiKeys.map((apiKey, i) => ({
            ...apiKey,
            key: i,
            operation: (
              <OperationWrapper>
                <EditPopover
                  del={() => {
                    CustomModal.confirm({
                      title: trans("profile.deleteApiKey"),
                      content: trans("profile.deleteApiKeyContent"),
                      onConfirm: () => {
                        UserApi.deleteApiKey(apiKey.id).then(resp => {
                          if(validateResponse(resp)) {
                            dispatch(fetchApiKeysAction());
                          }
                        })
                        .catch((e) => {
                          messageInstance.error(trans("profile.deleteApiKeyError"));
                        })
                      },
                      confirmBtnType: "delete",
                      okText: trans("delete"),
                    })
                  }}
                >
                  <PopoverIcon tabIndex={-1} />
                </EditPopover>
              </OperationWrapper>
            ),
          }))}
        />
      </Card>

      <CreateApiKeyModal
        modalVisible={modalVisible}
        closeModal={() => setModalVisible(false)}
        onConfigCreate={() => {
          setModalVisible(false);
          dispatch(fetchApiKeysAction());
        }}
      />
    </>
  )
}