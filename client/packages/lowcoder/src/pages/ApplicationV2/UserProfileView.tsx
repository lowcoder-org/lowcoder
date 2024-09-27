import { useDispatch, useSelector } from "react-redux";
import { UserProfileLayout } from "./UserProfileLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { trans } from "../../i18n";
import { USER_PROFILE_URL } from "constants/routesURL";
import { useEffect } from "react";
import { fetchApiKeysAction } from "redux/reduxActions/userActions";
import { Helmet } from "react-helmet";

export function UserProfileView() {

  const user = useSelector(getUser);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (!user.currentOrgId) return;

    dispatch(fetchApiKeysAction());
  }, []);

  if (!user.currentOrgId) {
    return null;
  }


  return (
    <>
      <Helmet>{<title>{trans("home.profile")}</title>}</Helmet>
      <UserProfileLayout breadcrumb={[{ text: trans("home.profile"), path: USER_PROFILE_URL }]} />
    </>
  );

};