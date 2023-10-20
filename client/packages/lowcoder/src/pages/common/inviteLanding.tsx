import InviteApi from "api/inviteApi";
import { API_STATUS_CODES, SERVER_ERROR_CODES } from "constants/apiConstants";
import { AUTH_LOGIN_URL, BASE_URL } from "constants/routesURL";
import { useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { StaticContext } from "react-router";
import { RouteComponentProps } from "react-router-dom";
import { AppState } from "redux/reducers";
import history from "util/history";
import { isFetchUserFinished } from "redux/selectors/usersSelectors";
import { fetchConfigAction } from "redux/reduxActions/configActions";
import { trans } from "i18n";
import { messageInstance } from "lowcoder-design";

type InviteLandingProp = RouteComponentProps<{ invitationId: string }, StaticContext, any> & {
  invitationId: string;
  fetchConfig: (orgId?: string) => void;
};

function InviteLanding(props: InviteLandingProp) {
  const { invitationId, fetchConfig } = props;
  const fetchUserFinished = useSelector(isFetchUserFinished);
  useEffect(() => {
    if (!fetchUserFinished) {
      // no user info replied from the backend
      return;
    }
    if (!invitationId) {
      history.push(BASE_URL);
      return;
    }
    let orgId:string | undefined = undefined;
    // accept the invitation
    InviteApi.acceptInvite({ invitationId })
      .then((resp) => {
        if (resp.data?.success) {
          messageInstance.success(trans("orgSettings.inviteSuccessMessage"));
          setTimeout(() => (window.location.href = BASE_URL), 500);
          return;
        } else if (
          resp.data.code === SERVER_ERROR_CODES.INVITE_USER_NOT_LOGIN ||
          resp?.status === API_STATUS_CODES.REQUEST_NOT_AUTHORISED
        ) {
          const inviteInfo = resp.data.data;
          orgId = inviteInfo.invitedOrganizationId;
          const inviteState = inviteInfo ? { ...inviteInfo, invitationId } : { invitationId };
          history.push({
            pathname: AUTH_LOGIN_URL,
            state: {
              inviteInfo: inviteState,
            },
          });
          return;
        }
        throw Error(resp.data?.message || trans("orgSettings.inviteFailMessage"));
      })
      .catch((errorResp) => {
        messageInstance.error(errorResp.message);
        history.push(BASE_URL);
      }).finally(() => {
        // fetchConfig(orgId);
      });
  }, [fetchUserFinished, invitationId, fetchConfig]);
  return null;
}

const mapStateToProps = (state: AppState, props: InviteLandingProp) => {
  return {
    invitationId: props.match.params.invitationId,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  fetchConfig: (orgId?: string) => dispatch(fetchConfigAction(orgId)),
});


export default connect(mapStateToProps, mapDispatchToProps)(InviteLanding);
