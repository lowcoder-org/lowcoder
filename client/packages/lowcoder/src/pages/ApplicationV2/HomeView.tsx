import { useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { folderElementsSelector } from "../../redux/selectors/folderSelector";

export function HomeView() {
  const elements = useSelector(folderElementsSelector)[""];
  const user = useSelector(getUser);

  if (!user.currentOrgId) {
    return null;
  }

  return <HomeLayout elements={elements} mode={"view"} />;
}
