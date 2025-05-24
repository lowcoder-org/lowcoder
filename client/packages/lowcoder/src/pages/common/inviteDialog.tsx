import InviteApi, { InviteInfo } from "api/inviteApi";
import { CommonTextLabel, CustomModal, TacoButton, TacoInput } from "lowcoder-design";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { connect } from "react-redux";
import { AppState } from "redux/reducers";
import { getUser } from "redux/selectors/usersSelectors";
import styled from "styled-components";
import { validateResponse } from "api/apiUtils";
import { WhiteLoading } from "lowcoder-design";
import { genInviteLink } from "util/urlUtils";
import { HelpText } from "components/HelpText";
import copyToClipboard from "copy-to-clipboard";
import { trans } from "i18n";
import { messageInstance } from "lowcoder-design/src/components/GlobalInstances";
import Divider from "antd/es/divider";
import Flex from "antd/es/flex";
import Select from "antd/es/select";

const InviteButton = styled(TacoButton)`
  width: 76px;
  float: right;
  margin-top: 8px;
`;

const StyledLoading = styled(WhiteLoading)`
  height: 170px;
`;

function InviteContent(props: { inviteInfo: InviteInfo, onClose?: () => void }) {
  const { inviteInfo, onClose } = props;
  const inviteLink = genInviteLink(inviteInfo?.inviteCode);
  const inviteText = trans("memberSettings.inviteText", {
    userName: inviteInfo.createUserName,
    organization: inviteInfo.invitedOrganizationName,
    inviteLink,
  });
  const [emails, setEmails] = useState<string[]>([]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const sendInvitations = async () => {
    const filteredEmails = emails.filter(isValidEmail);
    if (!filteredEmails.length) {
      return messageInstance.error(trans("memberSettings.noValidEmails"));
    }
    try {
      const resp = await InviteApi.sendInvitations({emails: filteredEmails, orgId: inviteInfo.invitedOrganizationId})
      if (validateResponse(resp) && resp.data.success) {
        messageInstance.success(trans('membersSettings.inviteByEmailSuccess'));
        onClose?.();
        return;
      }
      throw new Error(trans('membersSettings.inviteByEmailError'));
    } catch(e: any) {
      messageInstance.error(e.message);
    }
  }

  return (
    <>
      <HelpText style={{ marginBottom: 16 }}>{trans("memberSettings.inviteUserHelp")}</HelpText>
      <div>
        <CommonTextLabel>{trans("memberSettings.inviteUserLabel")}</CommonTextLabel>
        <TacoInput disabled value={inviteLink} style={{ marginTop: "8px" }} />
        <InviteButton
          buttonType="primary"
          onClick={() => {
            inviteText && copyToClipboard(inviteText)
              ? messageInstance.success(trans("copySuccess"))
              : messageInstance.error(trans("copyError"));
          }}
        >
          {trans("memberSettings.inviteCopyLink")}
        </InviteButton>
      </div>
      <Divider style={{marginTop: '60px'}}/>
      <HelpText style={{ marginBottom: 16 }}>{trans("memberSettings.inviteByEmailHelp")}</HelpText>
      <CommonTextLabel>{trans("memberSettings.inviteByEmailLabel")}</CommonTextLabel>
      <Select
        mode="tags"
        allowClear
        open={false}
        style={{ width: '100%', marginTop: '8px', marginBottom: '8px' }}
        placeholder="Enter emails"
        defaultValue={[]}
        onChange={(value) => {
          setEmails(value);
        }}
        options={[]}
        showSearch={false}
        suffixIcon={''}
      />
      <Flex justify="end">
        <TacoButton
          buttonType="primary"
          onClick={() => {
            sendInvitations();
          }}
          disabled={!Boolean(emails?.length)}
        >
          {trans("memberSettings.inviteByEmailButton")}
        </TacoButton>
      </Flex>
    </>
  );
}

function InviteDialog(props: {
  orgId: string | undefined;
  trigger: ReactNode;
  style?: CSSProperties;
}) {
  const { orgId } = props;
  const [inviteInfo, setInviteInfo] = useState<InviteInfo>();
  const [inviteDialogVisible, setInviteDialogVisible] = useState(false);
  useEffect(() => {
    // load link when display dialog
    if (inviteDialogVisible && orgId) {
      InviteApi.getInvite({ orgId: orgId })
        .then((resp) => {
          if (validateResponse(resp)) {
            setInviteInfo(resp.data.data);
          }
        })
        .catch((e) => {
          messageInstance.error(e.message);
        });
    }
  }, [inviteDialogVisible]);
  if (!orgId && inviteDialogVisible) {
    messageInstance.error(trans("memberSettings.organizationNotExist"));
    setInviteDialogVisible(false);
    return null;
  }

  return (
    <>
      {props.trigger && (
        <div
          style={props.style}
          onClick={() => {
            setInviteDialogVisible(true);
          }}
        >
          {props.trigger}
        </div>
      )}
      <CustomModal
        open={inviteDialogVisible}
        title={trans("memberSettings.inviteUser")}
        destroyOnHidden
        onCancel={() => setInviteDialogVisible(false)}
        showOkButton={false}
        showCancelButton={false}
        width="440px"
      >
        {!inviteInfo ? <StyledLoading size={20} /> : <InviteContent inviteInfo={inviteInfo} onClose={() => setInviteDialogVisible(false)} />}
      </CustomModal>
    </>
  );
}

const mapStateToProps = (state: AppState) => {
  return {
    orgId: getUser(state).currentOrgId,
  };
};

export default connect(mapStateToProps)(InviteDialog);
