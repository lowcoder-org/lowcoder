import { Helmet } from "react-helmet";
import { ApiDoc } from "./ApiDocLayout";
import { trans } from "i18n";

export function ApiDocView() {

  return (
    <><Helmet>
      {<title>{trans("productName")} {trans("home.api")}</title>}
    </Helmet><ApiDoc /></>
  );

};