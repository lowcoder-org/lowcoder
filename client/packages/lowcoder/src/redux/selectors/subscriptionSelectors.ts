import { Subscription } from "@lowcoder-ee/constants/subscriptionConstants";
import { AppState } from "redux/reducers";
import { getUser } from "./usersSelectors";
import { getDeploymentId } from "./configSelectors";
import { hasAiRobotAccess } from "util/aiRobotAccess";

export const getAiRobotAccess = (state: AppState): boolean => {
    const user = getUser(state);
    const role = user.orgRoleMap.get(user.currentOrgId);
    const subscriptionState = state.ui.subscriptions;
    return hasAiRobotAccess({
        hostId: getDeploymentId(state),
        orgId: user.currentOrgId,
        canEdit: !user.isAnonymous && (role === "admin" || role === "super_admin" || user.orgDev),
        loaded: subscriptionState.loadingStates.fetchSubscriptionsFinished,
        loading: subscriptionState.loadingStates.fetchingSubscriptions,
        error: subscriptionState.error,
        subscriptions: subscriptionState.subscriptions,
    });
};

export const getSubscriptions = (state: AppState) : Subscription[] => {
    return state.ui.subscriptions.subscriptions;
};

export const checkSubscriptionsLoading = (state: AppState) : boolean => {
    return state.ui.subscriptions.loadingStates.fetchingSubscriptions;
};

export const getFetchSubscriptionsFinished = (state: AppState) : boolean => {
    return state.ui.subscriptions.loadingStates.fetchSubscriptionsFinished;
};

export const getSubscriptionsError = (state: AppState) : string | undefined => {
    return state.ui.subscriptions.error;
};
