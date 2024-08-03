// index.tsx for routes
import { Route, Switch, useLocation } from 'react-router-dom';
import { SUBSCRIPTION_SETTING, SUBSCRIPTION_DETAIL } from 'constants/routesURL';
import { SubscriptionSetting } from './subscriptionSetting';
import SubscriptionContent from './subscriptionContent';

export const Subscription = () => {

  const location = useLocation();

  console.log("Current location:", location.pathname);

  return (
    <Switch>
      <Route path={SUBSCRIPTION_SETTING} component={SubscriptionSetting} exact />
      <Route path={SUBSCRIPTION_DETAIL} component={SubscriptionContent} exact />
    </Switch>
  );
};
