// index.tsx for routes
import { Route, Switch } from 'react-router-dom';
import { SUPPORT_URL, SUPPORT_DETAIL } from 'constants/routesURL';
import { SupportOverview } from './supportOverview';
import SupportDetail from './supportDetail';

export const Support = () => {

  return (
    <Switch>
      <Route path={SUPPORT_DETAIL} component={SupportDetail} exact />
      <Route path={SUPPORT_URL} component={SupportOverview} exact />
    </Switch>
  );
};
