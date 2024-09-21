import { ReduxActionTypes } from "constants/reduxActionConstants";
import { Subscription } from 'api/subscriptionApi';

// Action Creators
export const fetchSubscriptionsAction = () => ({
  type: ReduxActionTypes.FETCH_SUBSCRIPTIONS_INIT
});

export const fetchSubscriptionsSuccess = (subscriptions: Subscription[]) => ({
  type: ReduxActionTypes.FETCH_SUBSCRIPTIONS_SUCCESS,
  payload: subscriptions,
});

export const fetchSubscriptionsError = (error: string) => ({
  type: ReduxActionTypes.FETCH_SUBSCRIPTIONS_FAILURE,
  payload: { error },
});