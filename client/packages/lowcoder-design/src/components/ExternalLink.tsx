import { ActiveTextColor, GreyTextColor } from "constants/style";
import { DocIcon } from "icons";
import styled from "styled-components";
import { ToolTipLabel } from "./toolTip";

export const ExternalLink = styled.a`
  font-size: 13px;
  font-weight: 400;
  line-height: 13px;
  color: ${GreyTextColor};
  display: inline-flex;
  align-items: center;

  &:hover {
    color: ${ActiveTextColor};
  }
`;

const StyledDocIcon = styled(DocIcon)`
  height: 12px;
  width: 12px;
  margin-right: 4px;
`;

type DocLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  tooltipZIndex?: number;
};

export function DocLink(props: DocLinkProps) {
  if (!props.href) {
    return <></>;
  }
  const { title, children, rel, tooltipZIndex, ...rest } = props;
  const link = (
    <ExternalLink target="_blank" rel={rel ?? "noopener noreferrer"} {...rest}>
      <StyledDocIcon />
      {children}
    </ExternalLink>
  );
  if (!title) {
    return link;
  }
  return (
    <ToolTipLabel title={title} zIndex={tooltipZIndex}>
      <span style={{ display: "inline-flex" }}>{link}</span>
    </ToolTipLabel>
  );
}
