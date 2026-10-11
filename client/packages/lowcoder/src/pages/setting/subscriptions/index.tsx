// index.tsx for routes
import { Route, Switch } from 'react-router-dom';
import { SUBSCRIPTION_SETTING, SUBSCRIPTION_DETAIL, SUBSCRIPTION_INFO, SUBSCRIPTION_SUCCESS, SUBSCRIPTION_CANCEL, SUBSCRIPTION_ERROR } from 'constants/routesURL';
import { SubscriptionSetting } from './subscriptionSetting';
import SubscriptionSuccess from './subscriptionSuccess';
import SubscriptionCancel from './subscriptionCancel';
import SubscriptionError from './subscriptionError';
import SubscriptionDetail from './subscriptionDetail';
import SubscriptionInfo from './subscriptionInfo';
import { SubscriptionContextProvider } from '@lowcoder-ee/util/context/SubscriptionContext';

export const Subscription = () => {
  return (
    <SubscriptionContextProvider>
      <Switch>
        <Route path={SUBSCRIPTION_DETAIL} component={SubscriptionDetail} exact />
        <Route path={SUBSCRIPTION_INFO} component={SubscriptionInfo} exact />
        <Route path={SUBSCRIPTION_SUCCESS} component={SubscriptionSuccess} exact />
        <Route path={SUBSCRIPTION_CANCEL} component={SubscriptionCancel} exact />
        <Route path={SUBSCRIPTION_ERROR} component={SubscriptionError} exact />
        <Route path={SUBSCRIPTION_SETTING} component={SubscriptionSetting} exact />
      </Switch>
    </SubscriptionContextProvider>
  );
};
