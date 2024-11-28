import { Helmet } from "react-helmet";
import { PublishMobileLayout } from "./PublishMobileAppLayout";
import { trans } from "i18n";

export function PublishMobileAppView() {

  return (
    <><Helmet>
      {<title>{trans("home.PublishMobile")}</title>}
      </Helmet>
      <PublishMobileLayout />
    </>
  );

};