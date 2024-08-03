import { Route, Switch } from "react-router";
import { SUBSCRIPTION_SETTING, SUBSCRIPTION_SETTING_DETAIL } from "constants/routesURL";
import { SubscriptionList } from "./subscriptionList";
import { SubscriptionSettingContent}  from "./subscriptionSettingContent";

export const Organization = () => {
  return (
    <Switch>
      <Route path={SUBSCRIPTION_SETTING} component={SubscriptionList} exact />
      <Route path={SUBSCRIPTION_SETTING_DETAIL} component={SubscriptionSettingContent} exact />
    </Switch>
  );
};
