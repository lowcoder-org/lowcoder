import { useEffect, useState } from "react";
import { HomeLayout } from "./HomeLayout";
import { MARKETPLACE_TYPE_URL, MARKETPLACE_URL } from "constants/routesURL";
import { trans } from "../../i18n";
import axios, { AxiosResponse } from "axios";
import ApplicationApi from "@lowcoder-ee/api/applicationApi";
import { ApplicationMeta, MarketplaceType } from "@lowcoder-ee/constants/applicationConstants";
import { GenericApiResponse } from "@lowcoder-ee/api/apiResponses";
import { validateResponse } from "@lowcoder-ee/api/apiUtils";
import { messageInstance } from "lowcoder-design";
import { matchPath } from "react-router";
import log from "loglevel";

export function MarketplaceView() {
  const [ marketplaceApps, setMarketplaceApps ] = useState<Array<ApplicationMeta>>([]);
  const [ localMarketplaceApps, setLocalMarketplaceApps ] = useState<Array<ApplicationMeta>>([]);

  const fetchMarketplaceApps = async () => {
    try {
      let response: AxiosResponse<GenericApiResponse<ApplicationMeta[]>>;
      const http = axios.create({
        baseURL: trans("home.marketplaceURL"),
        withCredentials: false,
      });
      response = await http.get(`/api/v1/applications/marketplace-apps`);
      const isValidResponse: boolean = validateResponse(response);
      if (isValidResponse) {
        setMarketplaceApps(response.data.data);
      }
    } catch (error: any) {
      messageInstance.error(trans("home.errorMarketplaceApps"));
    }
  }

  const fetchLocalMarketplaceApps = async () => {
    try {
      let response: AxiosResponse<GenericApiResponse<ApplicationMeta[]>>;
      response = await ApplicationApi.fetchAllMarketplaceApps();
      const isValidResponse: boolean = validateResponse(response);
      if (isValidResponse) {
        setLocalMarketplaceApps(response.data.data);
      }
    } catch (error: any) {
      messageInstance.error(trans("home.errorMarketplaceApps"));
    }
  }

  useEffect(() => {
    fetchMarketplaceApps();
    fetchLocalMarketplaceApps();
  }, []);

  return (
    <HomeLayout
      elements={[]}
      localMarketplaceApps={localMarketplaceApps}
      globalMarketplaceApps={marketplaceApps}
      breadcrumb={[{ text: trans("home.marketplace"), path: MARKETPLACE_URL }]}
      mode={"marketplace"}
    />
  );
};