import { trans } from "i18n/design";
import React, { ReactNode, useContext } from "react";
import styled from "styled-components";
import { ReactComponent as Packup } from "icons/v1/icon-Pack-up.svg";
import { labelCss } from "./Label";
import { controlItem, ControlNode } from "./control";
import { Tooltip } from "./toolTip";

const SectionItem = styled.div<{ $width?: number }>`
  width: ${(props) => (props.$width ? props.$width : 312)}px;
  border-bottom: 1px solid #e1e3eb;

  &:last-child {
    border-bottom: none;
  }
`;
const SectionLabel = styled.div`
  ${labelCss};
  flex-grow: 1;
  font-size: 14px;
  color: #8b8fa3;
  line-height: 46px;
  font-weight: 600;

  &:hover {
    cursor: pointer;
  }
`;

interface Irotate {
  deg: string;
}

const PackupIcon = styled(Packup)<Irotate>`
  height: 20px;
  width: 20px;
  float: right;
  margin-top: 13px;
  margin-right: 16px;
  color: #8b8fa3;
  transform: ${(props) => props.deg};

  &:hover {
    cursor: pointer;
  }
`;

const SectionLabelDiv = styled.div`
  display: flex;
  justify-content: space-between;
  height: 46px;
  margin-left: 16px;

  &:hover {
    cursor: pointer;
  }

  &:hover ${SectionLabel} {
    color: #222222;
  }

  &:hover ${PackupIcon} path {
    fill: #222222;
  }
`;

const ShowChildren = styled.div<{ $show?: string; $noMargin?: boolean }>`
  display: ${(props) => props.$show || "none"};
  flex-direction: column;
  gap: 8px;
  transition: all 3s;
  margin-left: ${(props) => (props.$noMargin ? 0 : 16)}px;
  padding-bottom: 16px;
  padding-right: ${(props) => (props.$noMargin ? 0 : "16px")};
`;

const TooltipWrapper = styled.span`
  word-wrap: break-word;
  word-break: break-word;
  white-space: pre-wrap;
  color:#fff;
`;
interface ISectionConfig<T> {
  name?: string;
  open?: boolean;
  width?: number;
  noMargin?: boolean;
  style?: React.CSSProperties;
  children: T;
  additionalButton?: React.ReactNode;
  hasTooltip?: boolean;
}

export interface PropertySectionState {
  [compName: string]: {
    [sectionName: string]: boolean;
  };
}

export interface PropertySectionContextType {
  toggle: (compName: string, sectionName: string) => void;
  compName: string;
  state: PropertySectionState;
}

export const PropertySectionContext = React.createContext<PropertySectionContextType>({
  toggle: () => {},
  compName: "",
  state: {},
});

export const BaseSection = (props: ISectionConfig<ReactNode>) => {
  const { name,hasTooltip } = props;
  const { compName, state, toggle } = useContext(PropertySectionContext);
  const open = props.open !== undefined ? props.open : name ? state[compName]?.[name] !== false : true;

  // console.log("open", open, props.open);

  const handleToggle = () => {
    if (!name) {
      return;
    }
    toggle(compName, name);
  };

  return (
    <SectionItem $width={props.width} style={props.style}>
      {props.name && (
        <SectionLabelDiv onClick={handleToggle} className={'section-header'}>
          <SectionLabel>{props.name}</SectionLabel>
          <div style={{display: 'flex'}}>
            {open && props.additionalButton}
            <PackupIcon deg={open ? 'rotate(0deg)' : 'rotate(180deg)'} />
          </div>
        </SectionLabelDiv>
      )}
      <Tooltip
        title={
          hasTooltip && (
            <TooltipWrapper>
              Here you can enter the animation type codes. Like bounce, swing or
              tada. Read more about all possible codes at:{" "}
              <a href="https://animate.style">https://animate.style</a>
            </TooltipWrapper>
          )
        }
        arrow={{
          pointAtCenter: true,
        }}
        placement="top"
        color="#2c2c2c"
        getPopupContainer={(node: any) => node.closest('.react-grid-item')}
      >
        <ShowChildren $show={open ? 'flex' : 'none'} $noMargin={props.noMargin}>
          {props.children}
        </ShowChildren>
      </Tooltip>
    </SectionItem>
  );
};

export function Section(props: ISectionConfig<ControlNode>) {
  return controlItem({ filterText: props.name, searchChild: true }, <BaseSection {...props} />);
}

// common section names
export const sectionNames = {
  basic: trans("prop.basic"),
  interaction: trans("prop.interaction"),
  advanced: trans("prop.advanced"),
  validation: trans("prop.validation"),
  layout: trans("prop.layout"),
  style: trans("prop.style"),
  labelStyle:trans("prop.labelStyle"),
  animationStyle:trans("prop.animationStyle"),
  data: trans("prop.data"),
  meetings: trans("prop.meetings"), // added by Falk Wolsky
  field: trans("prop.field"),
  inputFieldStyle:trans("prop.inputFieldStyle"),
  childrenInputFieldStyle:trans("prop.childrenInputFieldStyle"),
  avatarStyle:trans("prop.avatarStyle"),
  captionStyle:trans("prop.captionStyle"),
  startButtonStyle:trans("prop.startButtonStyle"),
  resetButtonStyle:trans("prop.resetButtonStyle"),
  headerStyle:trans("prop.headerStyle"),
  bodyStyle:trans("prop.bodyStyle"),
  badgeStyle:trans("prop.badgeStyle"),
  columnStyle:trans("prop.columnStyle"),
  modalStyle:trans("prop.modalStyle"),
  chartStyle:trans("prop.chartStyle"),
  lineStyle:trans("prop.lineStyle"),
  titleStyle:trans("prop.titleStyle"),
  legendStyle:trans("prop.legendStyle"),
  detailStyle:trans("prop.detailStyle"),
  axisLabelStyle:trans("prop.axisLabelStyle"),
  axisLabelStyleOutline:trans("prop.axisLabelStyleOutline"),
  xAxisStyle:trans("prop.xAxisStyle"),
  yAxisStyle:trans("prop.yAxisStyle"),
  visualMapStyle:trans("prop.visualMapStyle")
};
