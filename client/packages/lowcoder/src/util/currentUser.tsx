import { useSelector } from "react-redux";
import { getCurrentUser, getUser } from "redux/selectors/usersSelectors";

export function useCurrentUser() {
  const currentUser = useSelector(getCurrentUser);
  const { hasPassword } = useSelector(getUser);
  return {...currentUser, hasPassword};
}
