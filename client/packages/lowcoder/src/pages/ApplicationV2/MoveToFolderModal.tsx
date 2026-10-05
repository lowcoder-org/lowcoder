import { HomeRes } from "./HomeLayout";
import { default as Form } from "antd/es/form";
import { default as TreeSelect } from "antd/es/tree-select";
import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  CustomModal,
  DatasourceForm,
  FolderIcon,
  FormSection,
  TacoButton,
} from "lowcoder-design";
import { moveToFolder, fetchFolderElements } from "../../redux/reduxActions/folderActions";
import styled from "styled-components";
import { trans } from "../../i18n";
import { foldersSelector } from "../../redux/selectors/folderSelector";
import {
  buildFolderHierarchy,
  flattenFolderTree,
  getFolderDisplayPath,
  getFolderPath,
} from "../../util/folderUtils";

const ROOT_NODE_KEY = "__root_folder__";

const MoveLabel = styled.div`
  font-size: 13px;
  color: #333333;
  line-height: 13px;
  margin-bottom: 8px;
`;

const MoveButton = styled(TacoButton)`
  width: 76px;
  height: 28px;
`;

const FolderTreeLabel = styled.div<{ $current?: boolean }>`
  display: flex;
  align-items: center;
  min-width: 0;
  opacity: ${(props) => (props.$current ? 0.5 : 1)};

  > span {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const FolderTreeFormItem = styled(Form.Item)`
  margin-bottom: 0;
`;

const FolderTreeSelect = styled(TreeSelect)`
  width: 100%;

  .ant-select-selector {
    min-height: 32px;
    padding: 0 8px !important;
  }

  .ant-select-selection-item {
    display: flex;
    align-items: center;
  }

  .ant-select-selection-search-input {
    height: 30px !important;
  }

  .ant-select-selection-placeholder {
    display: flex;
    align-items: center;
  }
`;

const FolderTreeDropdownClass = styled.div`
  overflow: hidden;
`;

const MoveModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 16px 16px 0;
  gap: 8px;
`;

export const MoveToFolderModal = (props: { source?: HomeRes; onClose: () => void, setModify: any, modify: boolean }) => {
  const {setModify} = props;
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);
  const [expandedFolderIds, setExpandedFolderIds] = useState<
    (string | number)[]
  >([ROOT_NODE_KEY]);
  const [folderSearch, setFolderSearch] = useState("");

  const folders = useSelector(foldersSelector);

  const dispatch = useDispatch();

  const { folderId } = useParams<{ folderId: string }>();

  const availableFolders = useMemo(
    () =>
      flattenFolderTree(folders).filter(
        (folder) => folder.folderId !== folderId,
      ),
    [folders, folderId],
  );

  const defaultDestination = folderId ? "" : availableFolders[0]?.folderId;

  const folderTreeData = useMemo(() => {
    const rootFolderName = trans("home.rootFolder");
    const renderFolderLabel = (name: string, isCurrent = false) => (
      <FolderTreeLabel $current={isCurrent}>
        <FolderIcon
          style={{ marginRight: "8px", width: "20px", flexShrink: 0 }}
        />
        <span>{name}</span>
      </FolderTreeLabel>
    );

    const toTreeSelectNode = (
      node: ReturnType<typeof buildFolderHierarchy>[number],
    ): any => {
      const isCurrent = node.folder.folderId === folderId;
      const selectedPath = `${rootFolderName} / ${getFolderDisplayPath(
        node.folder.folderId,
        folders,
      )}`;

      return {
        key: node.folder.folderId,
        value: node.folder.folderId,
        searchLabel: node.folder.name,
        selectable: !isCurrent,
        label: renderFolderLabel(node.folder.name, isCurrent),
        selectedLabel: renderFolderLabel(selectedPath),
        children: node.children.map(toTreeSelectNode),
      };
    };

    return [
      {
        key: ROOT_NODE_KEY,
        value: "",
        searchLabel: rootFolderName,
        selectable: Boolean(folderId),
        label: renderFolderLabel(rootFolderName, !folderId),
        selectedLabel: renderFolderLabel(rootFolderName),
        children: buildFolderHierarchy(folders).map(toTreeSelectNode),
      },
    ];
  }, [folders, folderId]);

  // Refresh the complete hierarchy whenever a different resource is selected.
  useEffect(() => {
    if (props.source?.id) {
      dispatch(fetchFolderElements({}));
    }
  }, [props.source?.id, dispatch]);

  useEffect(() => {
    form.resetFields();
    setFolderSearch("");
  }, [props.source?.id, form]);

  useEffect(() => {
    setExpandedFolderIds([
      ROOT_NODE_KEY,
      ...getFolderPath(folderId, folders).map((folder) => folder.folderId),
    ]);
  }, [props.source?.id, folderId, folders]);

  useEffect(() => {
    const selectedDestination = form.getFieldValue("folder");
    const hasValidDestination =
      (selectedDestination === "" && Boolean(folderId)) ||
      availableFolders.some(
        (folder) => folder.folderId === selectedDestination,
      );

    if (
      props.source &&
      !hasValidDestination &&
      defaultDestination !== undefined
    ) {
      form.setFieldValue("folder", defaultDestination);
    }
  }, [props.source, defaultDestination, folderId, availableFolders, form]);

  return (
    <CustomModal
      open={!!props.source}
      onCancel={props.onClose}
      destroyOnHidden={true}
      width="440px"
      centered={true}
      title={trans("home.moveToFolder")}
      footer={
        <MoveModalFooter>
          <MoveButton onClick={props.onClose}>{trans("cancel")}</MoveButton>
          <MoveButton
            autoFocus={true}
            buttonType="primary"
            loading={loading}
            onClick={() => {
              form.validateFields().then(() => {
                setLoading(true);
                dispatch(
                  moveToFolder(
                    {
                      sourceFolderId: folderId || "",
                      sourceId: props.source?.id!,
                      folderId: form.getFieldValue("folder"),
                    },
                    () => {
                      props.onClose();
                      setLoading(false);
                      setModify((value: boolean) => !value);
                    },
                    () => setLoading(false)
                  )
                );
              });
            }}
          >
            {trans("move")}
          </MoveButton>
        </MoveModalFooter>
      }
    >
      <DatasourceForm form={form} preserve={false} style={{ gap: "12px" }}>
        <FormSection>
          <MoveLabel>
            {trans("home.moveToFolderSubTitle", { name: props.source?.name ?? "" })}
          </MoveLabel>
          <FolderTreeFormItem
            name="folder"
            initialValue={defaultDestination}
            rules={[
              {
                validator: (_, value) =>
                  value === undefined
                    ? Promise.reject(
                        new Error(trans("home.selectFolderDestination")),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <FolderTreeSelect
              treeData={folderTreeData}
              fieldNames={{
                label: "label",
                value: "value",
                children: "children",
              }}
              treeNodeLabelProp="selectedLabel"
              treeLine={{ showLeafIcon: false }}
              treeExpandedKeys={folderSearch ? undefined : expandedFolderIds}
              onTreeExpand={(keys) =>
                setExpandedFolderIds(keys as (string | number)[])
              }
              showSearch
              searchValue={folderSearch}
              onSearch={setFolderSearch}
              filterTreeNode={(input, node: any) =>
                node.searchLabel
                  ?.toLocaleLowerCase()
                  .includes(input.toLocaleLowerCase())
              }
              placeholder={trans("home.selectFolderDestination")}
              listHeight={280}
              popupMatchSelectWidth
              popupRender={(menu) => (
                <FolderTreeDropdownClass>{menu}</FolderTreeDropdownClass>
              )}
            />
          </FolderTreeFormItem>
        </FormSection>
      </DatasourceForm>
    </CustomModal>
  );
};
