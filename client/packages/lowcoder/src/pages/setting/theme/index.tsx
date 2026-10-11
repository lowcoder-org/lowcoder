import { Route, Switch } from "react-router";
import ThemePage from "./themePage";
import ThemeDetailPage from "./detail";
import { THEME_DETAIL_URL, THEME_SETTING } from "constants/routesURL";
import { useDispatch, useSelector } from "react-redux";
import { getUser } from "@lowcoder-ee/redux/selectors/usersSelectors";
import { useEffect } from "react";
import { fetchCommonSettings } from "@lowcoder-ee/redux/reduxActions/commonSettingsActions";

export const ThemeHome = () => {
  const dispatch = useDispatch();
  const user = useSelector(getUser);
  const orgId = user.currentOrgId;

  useEffect(() => {
    dispatch(fetchCommonSettings({ orgId }));
  }, []);

  return (
    <Switch>
      <Route path={THEME_SETTING} component={ThemePage} exact />
      <Route path={THEME_DETAIL_URL} component={ThemeDetailPage} exact />
    </Switch>
  );
};
