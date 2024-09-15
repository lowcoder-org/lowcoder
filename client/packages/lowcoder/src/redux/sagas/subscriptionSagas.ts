import { call, put, select, takeLatest, all } from 'redux-saga/effects';
import { fetchSubscriptionsAction } from 'redux/reduxActions/subscriptionActions';
import { searchCustomersSubscriptions, Subscription } from 'api/subscriptionApi';
import { fetchSubscriptionsSuccess, fetchSubscriptionsError } from 'redux/reduxActions/subscriptionActions';
import { LowcoderSearchCustomer } from 'api/subscriptionApi';
import { getUser, getCurrentUser } from 'redux/selectors/usersSelectors';
import { CurrentUser, User } from '@lowcoder-ee/constants/userConstants';
import { ReduxActionTypes } from '@lowcoder-ee/constants/reduxActionConstants';

function* fetchSubscriptionsSaga(action: ReturnType<typeof fetchSubscriptionsAction>) {

  try {
    const user: User = yield select(getUser);
    const currentUser: CurrentUser = yield select(getCurrentUser); 
    const orgID = user.currentOrgId;
    const domain = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

    const subscriptionSearchCustomer: LowcoderSearchCustomer = {
      hostname: domain,
      email: currentUser.email,
      orgId: orgID,
      userId: user.id,
    };

    const subscriptions: Subscription[] = yield call(searchCustomersSubscriptions, subscriptionSearchCustomer);
    
    yield put(fetchSubscriptionsSuccess(subscriptions));
  } catch (error) {
    // Handle the error and dispatch a failure action
    if (error instanceof Error) {
      yield put(fetchSubscriptionsError(error.message));
    } else {
      yield put(fetchSubscriptionsError("An unknown error occurred"));
    }
  }
}

export function* watchFetchSubscriptions() {
  yield takeLatest(ReduxActionTypes.FETCH_SUBSCRIPTIONS_INIT, fetchSubscriptionsSaga);
}

export default function* subscriptionSagas() {
  yield all([
    watchFetchSubscriptions(),
  ]);
}