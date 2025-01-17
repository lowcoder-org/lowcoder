import * as React from "react";
import { CSSProperties, ReactNode } from "react";
import { SideBarItem, SideBarItemProps } from "./SideBarItem";
import styled from "styled-components";
import { CNSidebarSection } from "../../constants/styleSelectors";
import { User } from "../../constants/userConstants";
import { ApplicationMeta } from "../../constants/applicationConstants";
import { useSelector } from "react-redux";
import { AppState } from "../../redux/reducers";
import { getUser } from "../../redux/selectors/usersSelectors";
import { normalAppListSelector } from "../../redux/selectors/applicationSelector";
import { useLocation } from "react-router-dom";
import history from "../../util/history";
import { getBrandingSettings } from "@lowcoder-ee/redux/selectors/commonSettingSelectors";

const defaultOnSelectedFn = (routePath: string, currentPath: string) => routePath === currentPath;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SideBarSection = (props: SideBarSectionProps) => {
  const user = useSelector<AppState, User>(getUser);
  const applications = useSelector<AppState, ApplicationMeta[]>(normalAppListSelector);
  const brandingSettings = useSelector(getBrandingSettings);
  const currentPath = useLocation().pathname;
  const isShow = props.items
    .map((item) => (item.visible ? item.visible({ user: user, applications: applications }) : true))
    .includes(true);

  return (
    <Wrapper className={isShow ? CNSidebarSection : ""} style={props.style}>
      {props.title}
      {props.items
        .filter((item) =>
          item.visible ? item.visible({ user: user, applications: applications }) : true
        )
        .map((item, index) => {
          return (
            <SideBarItem
              key={index}
              {...item}
              selected={
                item.onSelected
                  ? item.onSelected(item.routePath, currentPath)
                  : defaultOnSelectedFn(item.routePath, currentPath)
              }
              selectedBgColor={brandingSettings?.adminSidebarActiveBgColor}
              selectedFontColor={brandingSettings?.adminSidebarActiveFontColor}
              onClick={() => {
                // Trigger item's onClick if defined
                item.onClick
                  ? item.onClick("")
                  : currentPath !== item.routePath && history.push(item.routePath);

                // Trigger parent onItemClick to close the drawer
                props.onItemClick?.();
              }}
            />
          );
        })}
    </Wrapper>
  );
};

export type SideBarItemType = Omit<SideBarItemProps, "selected"> & {
  onSelected?: (routePath: string, currentPath: string) => boolean; // Customize select logic from URL path
  routePath: string;
  routePathExact?: boolean;
  visible?: (params: { user: User; applications: ApplicationMeta[] }) => boolean;
  routeComp: React.ComponentType<any>;
  mobileVisible?: boolean;
};

export interface SideBarSectionProps {
  title?: ReactNode;
  items: SideBarItemType[];
  style?: CSSProperties;
  onItemClick?: () => void; // New prop for handling item click
}
