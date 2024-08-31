import { useSelector } from "react-redux";
import { getUser, getCurrentUser } from "redux/selectors/usersSelectors";

export const useUserDetails = () => {
  const user = useSelector(getUser);
  const currentUser = useSelector(getCurrentUser);
  const orgID = user.currentOrgId;
  const domain =
    window.location.protocol +
    "//" +
    window.location.hostname +
    (window.location.port ? ":" + window.location.port : "");

  return {
    orgID,
    currentUser,
    domain,
  };
};