import { Helmet } from "react-helmet";
import { NewsLayout } from "./NewsLayout";
import { trans } from "i18n";

export function NewsView() {

  return (
    <><Helmet>
      {<title>{trans("productName")} {trans("home.news")}</title>}
    </Helmet><NewsLayout /></>
  );

};