import { trans } from "i18n/design";
import { ReactNode, useMemo } from "react";
import styled from "styled-components";
import { ReactComponent as ContainerDrag } from "icons/v1/icon-container-drag.svg";
import React from "react";

type ContainerPlaceholderProps = {
  children?: ReactNode;
};

const HintText = styled.span`
  font-size: 13px;
  color: #b8b9bf;
  text-align: center;
`;

const ContainerWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledContainerDrag = styled(ContainerDrag)`
  vertical-align: bottom;
  margin-right: 8px;
`;

export const ContainerPlaceholder = React.memo(function ContainerPlaceholder(props: ContainerPlaceholderProps) {
  return (
    <ContainerWrapper>
      <HintText>
        <StyledContainerDrag />
        {props.children}
      </HintText>
    </ContainerWrapper>
  );
});

// Create a memoized version of the placeholder
export const HintPlaceHolder = (
  <ContainerPlaceholder>{trans("container.hintPlaceHolder")}</ContainerPlaceholder>
);
