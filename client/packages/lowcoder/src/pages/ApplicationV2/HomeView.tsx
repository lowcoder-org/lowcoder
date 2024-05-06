import { useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { getUser } from "../../redux/selectors/usersSelectors";
import { folderElementsSelector } from "../../redux/selectors/folderSelector";
import { Helmet } from "react-helmet";
import { trans } from "i18n";

export function HomeView() {
  const elements = useSelector(folderElementsSelector)[""];
  const user = useSelector(getUser);

  if (!user.currentOrgId) {
    return null;
  }

  return (
    <>
      <Helmet>{<title>{trans("productName")} {trans("home.home")}</title>}</Helmet>
      <HomeLayout 
        elements={elements} 
        mode={"view"} 
      />
    </>
  );
}
