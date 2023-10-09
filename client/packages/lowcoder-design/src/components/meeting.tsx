import { trans } from "i18n/design";
import { ReactNode } from "react";
import styled from "styled-components";
import { ReactComponent as MeetingContainerDrag } from "icons/icon-left-comp-video.svg";

type MeetingContainerPlaceholderProps = {
  children?: ReactNode;
};

const HintText = styled.span`
  font-size: 13px;
  color: #b8b9bf;
  text-align: center;
`;

export function MeetingContainerPlaceholder(
  props: MeetingContainerPlaceholderProps
) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HintText>
        <MeetingContainerDrag
          style={{ verticalAlign: "bottom", marginRight: "8px" }}
        />
        {props.children}
      </HintText>
    </div>
  );
}

export const MeetingHintPlaceHolder = (
  <MeetingContainerPlaceholder>
    {trans("container.hintPlaceHolder")}
  </MeetingContainerPlaceholder>
);
