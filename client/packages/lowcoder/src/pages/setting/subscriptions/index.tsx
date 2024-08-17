// index.tsx for routes
import { Route, Switch, useLocation } from 'react-router-dom';
import { SUBSCRIPTION_SETTING, SUBSCRIPTION_DETAIL, SUBSCRIPTION_SUCCESS, SUBSCRIPTION_ERROR } from 'constants/routesURL';
import { SubscriptionSetting } from './subscriptionSetting';
import { SubscriptionSuccess } from './subscriptionSuccess';
import { SubscriptionError} from './subscriptionError';
import SubscriptionContent from './subscriptionContent';

export const Subscription = () => {

  const location = useLocation();

  return (
    <Switch>
      <Route path={SUBSCRIPTION_SETTING} component={SubscriptionSetting} exact />
      <Route path={SUBSCRIPTION_DETAIL} component={SubscriptionContent} exact />
      <Route path={SUBSCRIPTION_SUCCESS} component={SubscriptionSuccess} exact />
      <Route path={SUBSCRIPTION_ERROR} component={SubscriptionError} exact />
    </Switch>
  );
};
