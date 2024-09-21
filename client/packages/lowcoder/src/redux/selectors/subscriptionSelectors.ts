import { AppState } from "redux/reducers";
import { Subscription } from "api/subscriptionApi";

export const getSubscriptions = (state: AppState) : Subscription[] => {
    return state.ui.subscriptions.subscriptions;
};

export const checkSubscriptionsLoading = (state: AppState) : boolean => {
    return state.ui.subscriptions.loadingStates.fetchingSubscriptions;
};

export const checkSubscriptionsError = (state: AppState) : string | null => {
    return state.ui.subscriptions.error;
}; 