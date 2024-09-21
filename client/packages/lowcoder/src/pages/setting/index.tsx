import { BASE_URL, SETTING_URL } from "constants/routesURL";
import { useSelector } from "react-redux";
import { getUser } from "redux/selectors/usersSelectors";
import { currentOrgAdminOrDev } from "util/permissionUtils";
import history from "util/history";
import { Route, Switch } from "react-router-dom";
import SettingHome from "./settingHome";

export function Setting() {
  const user = useSelector(getUser);

  if (!currentOrgAdminOrDev(user)) {
    history.push(BASE_URL);
  }

  return (
    <Switch>
      <Route path={[`${SETTING_URL}/:setting`, SETTING_URL]} component={SettingHome} />
    </Switch>
  );
}

export default Setting;
