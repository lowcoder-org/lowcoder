import { Route, Switch } from "react-router";
import { IdSourceList } from "pages/setting/idSource/list";
import { IdSourceDetail } from "pages/setting/idSource/detail";
import { OAUTH_PROVIDER_SETTING, OAUTH_PROVIDER_DETAIL } from "constants/routesURL";

export const IdSourceHome = () => {
  return (
    <Switch>
      <Route path={OAUTH_PROVIDER_SETTING} component={IdSourceList} exact />
      <Route path={OAUTH_PROVIDER_DETAIL} component={IdSourceDetail} exact />
    </Switch>
  );
};
