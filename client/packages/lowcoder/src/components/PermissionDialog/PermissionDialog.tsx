import React, { ReactNode, useState } from "react";
import { PermissionItemsType, PermissionList } from "./PermissionList";
import StepModal from "../StepModal";
import { trans } from "../../i18n";
import { Permission, PermissionRole } from "./Permission";

export const PermissionDialog = (props: {
  title: string;
  ownerLabel: string;
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
  viewBodyRender?: (list: ReactNode) => ReactNode;
  viewFooterRender?: (primaryModelProps: any, props: any) => ReactNode;
  permissionItems: PermissionItemsType;
  supportRoles: { label: string; value: PermissionRole }[];
  addPermission: (
    userIds: string[],
    groupIds: string[],
    role: string,
    onSuccess: () => void
  ) => void;
  updatePermission: (permissionId: string, role: string) => void;
  deletePermission: (permissionId: string) => void;
  primaryModelProps?: {};
}) => {
  const {
    supportRoles,
    permissionItems,
    visible,
    onVisibleChange,
    addPermission,
    viewBodyRender,
    viewFooterRender,
    primaryModelProps,
  } = props;
  const [activeStepKey, setActiveStepKey] = useState("view");

  return (
    <StepModal
      open={visible}
      destroyOnHidden
      onCancel={() => {
        setActiveStepKey("view");
        onVisibleChange(false);
      }}
      showOkButton={false}
      showCancelButton={false}
      width="440px"
      onStepChange={setActiveStepKey}
      activeStepKey={activeStepKey}
      steps={[
        {
          key: "view",
          titleRender: () => props.title,
          bodyRender: () =>
            viewBodyRender ? (
              viewBodyRender(<PermissionList {...props} />)
            ) : (
              <PermissionList {...props} />
            ),
          footerRender: (props) =>
            viewFooterRender
              ? viewFooterRender(primaryModelProps, props)
              : null,
        },
        {
          key: "add",
          titleRender: () => trans("home.addMember"),
          bodyRender: (props) => (
            <Permission
              supportRoles={supportRoles}
              filterItems={permissionItems.map((i) => i.permissionItem)}
              onCancel={props.back}
              addPermission={(userIds, groupIds, role) =>
                addPermission(userIds, groupIds, role, props.back)
              }
            />
          ),
          footerRender: () => null,
        },
      ]}
    />
  );
};
