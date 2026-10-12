import { GreyTextColor } from "constants/style";
import { TacoButton, CustomModal, TacoInput } from "lowcoder-design";
import styled from "styled-components";

export const TwoColumnSettingPageContent = styled.div`
  display: flex;
  height: 100%;
  min-width: 0;
  @media (max-width: 1100px) { flex-direction: column; height: auto; }
`;

export const Level1SettingPageContent = styled.div`
  padding: 32px 36px 32px 24px;
  max-width: 2200px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: auto;
  overflow-wrap: anywhere;
  .ant-card { min-width: 0; }
  .ant-card-head-title { white-space: normal; overflow-wrap: anywhere; padding: 16px 0; }
  .ant-card-head-wrapper { min-width: 0; gap: 12px; }
  @media (max-width: 720px) { padding: 24px 16px; }
`;

// All subscription routes and the license panel share one page gutter.
export const SubscriptionPageContent = styled(Level1SettingPageContent)`
  > ${Level1SettingPageContent} { padding: 0; overflow: visible; }
  > .ant-card { margin-top: 24px; }
`;

export const Level1SettingPageContentWithList = styled(Level1SettingPageContent)`
  padding: 32px 24px 32px 12px;
`;

export const Level1SettingPageTitle = styled.div`
  font-size: 26px;
  font-weight: 500;
  color: var(--admin-ink, #281a30);
  line-height: 1.3;
  letter-spacing: -0.025em;
  display: flex;
  min-width: 0;
  justify-items: center;
  margin-bottom: 28px;
`;

export const Level1SettingPageTitleWithBtn = styled(Level1SettingPageTitle)`
  justify-content: space-between;
  margin: 0 12px 15px 12px;
  min-height: 38px;
  height: auto;
  flex-wrap: wrap;
  gap: 12px;
`;
export const SettingContent = styled.div`
  max-width: 840px;
  .section-title {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .section-content {
    margin-bottom: 32px;
  }
  .section-option {
    color: ${GreyTextColor};
    margin-bottom: 14px;
    font-size: 13px;
  }
  .code-editor {
    margin-bottom: 12px;
  }
`;

export const SaveButton = styled(TacoButton)`
  min-width: 76px;
`;

export const ModalNameDiv = styled.div`
  display: flex;
  align-items: center;
  padding: 3.5px 0;
  svg {
    margin-right: 4px;
  }
`;

export const CustomModalStyled = styled(CustomModal)`
  // button {
  //   margin-top: 20px;
  // }
`;

export const TacoInputStyled = styled(TacoInput)`
  margin-bottom: 5px;
  height: 32px;
  > input {
    height: 100%;
  }
  .ant-input-suffix {
    color: #999;
  }
  &.exceed .input-length {
    color: #f73131;
  }
`;
