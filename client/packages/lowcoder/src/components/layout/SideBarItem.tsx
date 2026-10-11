import styled, { css } from "styled-components";
import * as React from "react";
import { CSSProperties, FunctionComponent, ReactNode, SVGProps } from "react";
import { CNSidebarItem } from "../../constants/styleSelectors";
import { useLocation } from "react-router-dom";

type SideBarSize = "medium" | "small";

const Wrapper = styled.div<{
  $size?: SideBarSize;
  $selected?: boolean;
  $selectedBgColor?: string;
  $selectedFontColor?: string;
}>`
  width: 100%;
  height: ${(props) => (props.$size === "small" ? "36px" : "44px")};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 26px;
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.$selected ? (
      `${props.$selectedBgColor ? props.$selectedBgColor : '#ebf0f7'}`
    ) : (
      `${props.$selectedBgColor ? props.$selectedBgColor : '#efeff1'}`
    ))};
    color: ${(props) => props.$selectedFontColor ? props.$selectedFontColor : '#4965f2'}
  }

  svg {
    width:24px
  }

  ${(props) =>
    props.$selected &&
    css`
      color: ${props.$selectedFontColor ? props.$selectedFontColor : '#4965f2'};
      background: ${props.$selectedBgColor ? props.$selectedBgColor : '#ebf0f7'};
    `}
`;

export const SideBarItem = (props: SideBarItemProps) => {
  const Icon = props.icon;
  const Text = props.text;
  const currentPath = useLocation().pathname;
  return (
    <Wrapper
      style={props.style}
      className={CNSidebarItem}
      $size={props.size}
      $selected={props.selected}
      $selectedBgColor={props.selectedBgColor}
      $selectedFontColor={props.selectedFontColor}
      onClick={() => props.onClick?.(currentPath)}
    >
      {Icon && <Icon selected={props.selected} style={{ marginRight: "8px" }} />}
      {typeof Text === "function" ? <Text selected={props.selected} /> : Text ?? null}
    </Wrapper>
  );
};

export interface SideBarItemProps {
  icon?: FunctionComponent<SVGProps<any> & { selected?: boolean }>;
  text: ReactNode | FunctionComponent<{ selected?: boolean }>;
  selected?: boolean;
  selectedBgColor?: string;
  selectedFontColor?: string;
  size?: SideBarSize;
  onClick?: (currentPath: string) => void;
  style?: CSSProperties;
}
