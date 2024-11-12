import { Helmet } from "react-helmet";
import { DeveloperNetworkLayout } from "./DeveloperNetworkLayout";
import { trans } from "i18n";

export function DeveloperNetworkView() {

  return (
    <><Helmet>
      {<title>{trans("productName")} {trans("home.news")}</title>}
    </Helmet><DeveloperNetworkLayout /></>
  );

};