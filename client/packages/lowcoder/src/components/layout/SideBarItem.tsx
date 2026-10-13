import styled, { css } from "styled-components";
import * as React from "react";
import { CSSProperties, FunctionComponent, ReactNode, SVGProps } from "react";
import { CNSidebarItem } from "../../constants/styleSelectors";
import { useLocation } from "react-router-dom";

type SideBarSize = "medium" | "small";

const Wrapper = styled.button<{
  $size?: SideBarSize;
  $selected?: boolean;
  $selectedBgColor?: string;
  $selectedFontColor?: string;
}>`
  appearance: none;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  transition: background 150ms, color 150ms;
  width: 100%;
  height: ${(props) => (props.$size === "small" ? "36px" : "44px")};
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 4px;
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.$selected ? (
      `${props.$selectedBgColor ? props.$selectedBgColor : 'var(--admin-sidebar-active, #eadcf3)'}`
    ) : (
      `${props.$selectedBgColor ? props.$selectedBgColor : 'var(--admin-sidebar-active, #f0e6f6)'}`
    ))};
    color: ${(props) => props.$selectedFontColor ? props.$selectedFontColor : 'var(--admin-sidebar-active-text, #683e86)'}
  }

  svg {
    width:24px
  }

  ${(props) =>
    props.$selected &&
    css`
      color: ${props.$selectedFontColor ? props.$selectedFontColor : 'var(--admin-sidebar-active-text, #683e86)'};
      background: ${props.$selectedBgColor ? props.$selectedBgColor : 'var(--admin-sidebar-active, #eadcf3)'};
    `}
`;

export const SideBarItem = (props: SideBarItemProps) => {
  const Icon = props.icon;
  const Text = props.text;
  const currentPath = useLocation().pathname;
  return (
    <Wrapper
      type="button"
      aria-current={props.selected ? "page" : undefined}
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
