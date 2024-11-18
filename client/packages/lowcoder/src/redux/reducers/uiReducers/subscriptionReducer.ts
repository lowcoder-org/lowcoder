import { Subscription } from "@lowcoder-ee/constants/subscriptionConstants";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/reduxActionConstants";
import { createReducer } from "util/reducerUtils";

const initialState: SubscriptionsReduxState = {
  subscriptions: [],
  loadingStates: {
    fetchingSubscriptions: false,
    fetchSubscriptionsFinished: false,
  },
  error: undefined,
};

const subscriptionReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_SUBSCRIPTIONS_INIT]: (state: SubscriptionsReduxState): SubscriptionsReduxState => ({
    ...state,
    loadingStates: {
      ...state.loadingStates,
      fetchingSubscriptions: true,
    },
    error: undefined,
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
    error: undefined,
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
  error?: string;
}

export default subscriptionReducer;
