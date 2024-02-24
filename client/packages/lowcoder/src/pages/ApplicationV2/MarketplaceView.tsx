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
  const marketplaceType = matchPath<{marketplaceType?: MarketplaceType}>(window.location.pathname, MARKETPLACE_TYPE_URL)?.params
    .marketplaceType;
  const isLowcoderMarketplace = marketplaceType === 'lowcoder';
  const marketplaceBreadcrumbText = !marketplaceType?.length
    ? trans("home.marketplace")
    : marketplaceType === 'lowcoder'
    ? `${trans("home.marketplace")} (Lowcoder)`
    : `${trans("home.marketplace")} (Local)`;

  const fetchLowcoderMarketplaceApps = () => {
    const http = axios.create({
      baseURL: 'https://api-service.lowcoder.cloud',
      withCredentials: false,
    });
    return http.get(`/api/v1/applications/marketplace-apps`);
  };

  const fetchLocalMarketplaceApps = () => {
    return ApplicationApi.fetchAllMarketplaceApps()
  }

  const fetchMarketplaceApps = async () => {
    try {
      let response: AxiosResponse<GenericApiResponse<ApplicationMeta[]>>;
      if(isLowcoderMarketplace) {
        response = await fetchLowcoderMarketplaceApps();
      } else {
        response = await fetchLocalMarketplaceApps();
      }

      const isValidResponse: boolean = validateResponse(response);
      if (isValidResponse) {
        setMarketplaceApps(response.data.data);
      }
    } catch (error: any) {
      messageInstance.error(error.message);
      log.debug("fetch marketplace apps error: ", error);
    }
  }

  useEffect(() => {
    fetchMarketplaceApps();
  }, [marketplaceType]);

  return (
    <HomeLayout
      elements={marketplaceApps}
      breadcrumb={[{ text: marketplaceBreadcrumbText, path: MARKETPLACE_URL }]}
      mode={"marketplace"}
    />
  );
};