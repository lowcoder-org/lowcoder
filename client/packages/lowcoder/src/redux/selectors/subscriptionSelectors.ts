import { Subscription } from "@lowcoder-ee/constants/subscriptionConstants";
import { AppState } from "redux/reducers";

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