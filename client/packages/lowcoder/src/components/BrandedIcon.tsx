import { getBrandingSetting } from "@lowcoder-ee/redux/selectors/enterpriseSelectors";
import { ReactNode } from "react";
import { useSelector } from "react-redux";
import { styled } from "styled-components";

const IconWrapper = styled.span<{$color?: string}>`
  svg > path[fill-rule='evenodd'] {
    ${props => props.$color && `fill: ${props.$color}` };
  }
`;

export const BrandedIcon = (props: {
  children: ReactNode,
}) => {
  const brandingSettings = useSelector(getBrandingSetting);
  return (
    <IconWrapper $color={brandingSettings?.config_set?.mainBrandingColor}>
      {props.children}
    </IconWrapper>
  );
};
