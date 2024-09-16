import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/reduxActionConstants";
import { createReducer } from "util/reducerUtils";
import { Subscription } from "api/subscriptionApi";

const initialState: SubscriptionsReduxState = {
  subscriptions: [],
  loadingStates: {
    fetchingSubscriptions: false,
    fetchSubscriptionsFinished: false,
  },
  error: "",
};

const subscriptionReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_SUBSCRIPTIONS_INIT]: (state: SubscriptionsReduxState): SubscriptionsReduxState => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingSubscriptions: true,
    },
  }),
  
  [ReduxActionTypes.FETCH_SUBSCRIPTIONS_SUCCESS]: (
    state: SubscriptionsReduxState,
    action: ReduxAction<Subscription[]>
  ): SubscriptionsReduxState => ({
    ...state,
    subscriptions: action.payload,
    loadingStates: {
      ...state.loadingStates,
      fetchingSubscriptions: false,
      fetchSubscriptionsFinished: true,
    },
  }),
  
  [ReduxActionErrorTypes.FETCH_SUBSCRIPTIONS_ERROR]: (
    state: SubscriptionsReduxState,
    action: ReduxAction<string>
  ): SubscriptionsReduxState => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingSubscriptions: false,
      fetchSubscriptionsFinished: true,
    },
    error: action.payload,
  }),
});

export interface SubscriptionsReduxState {
  subscriptions: Subscription[];
  loadingStates: {
    fetchingSubscriptions: boolean;
    fetchSubscriptionsFinished: boolean;
  };
  error: string;
}

export default subscriptionReducer;
