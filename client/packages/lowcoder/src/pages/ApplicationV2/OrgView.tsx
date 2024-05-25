import { Helmet } from "react-helmet";
import { OrgLayout } from "./OrgLayout";
import { trans } from "i18n";

export function OrgView() {

  return (
    <><Helmet>
      {<title>{trans("home.orgHomeTitle")}</title>}
    </Helmet><OrgLayout /></>
  );

};