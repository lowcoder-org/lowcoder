import { useSelector } from "react-redux";
import { UserProfileLayout } from "./UserProfileLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { trans } from "../../i18n";
import { USER_PROFILE_URL } from "constants/routesURL";

export function UserProfileView() {

  const user = useSelector(getUser);

  if (!user.currentOrgId) {
    return null;
  }

  return <UserProfileLayout breadcrumb={[{ text: trans("home.profile"), path: USER_PROFILE_URL }]}/>;

};