import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { HomeLayout } from "./HomeLayout";
import { MARKETPLACE_URL } from "constants/routesURL";
import { marketplaceSelector } from "redux/selectors/applicationSelector";
import { fetchAllMarketplaceApps } from "redux/reduxActions/applicationActions";
import { trans } from "../../i18n";

export function MarketplaceView() {
  const [haveFetchedApps, setHaveFetchApps] = useState<boolean>(false);

  const dispatch = useDispatch();
  const marketplaceApps = useSelector(marketplaceSelector);

  useEffect(() => {
    if (!marketplaceApps.length && !haveFetchedApps) {
      dispatch(fetchAllMarketplaceApps());
      setHaveFetchApps(true);
    }
  }, []);

  useEffect(() => {
    if (marketplaceApps.length) {
      setHaveFetchApps(true);
    }
  }, [marketplaceApps])

  return (
    <HomeLayout
      elements={marketplaceApps}
      breadcrumb={[{ text: trans("home.marketplace"), path: MARKETPLACE_URL }]}
      mode={"marketplace"}
    />
  );
};