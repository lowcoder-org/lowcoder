import { SystemConfig } from "constants/configConstants";
import { useSelector } from "react-redux";
import { selectSystemConfig } from "redux/selectors/configSelectors";
// import { useCheckSubscriptions, SubscriptionProducts, SubscriptionsData } from "@lowcoder-ee/api/subscriptionApi";

export function localEnv(): boolean {
  return REACT_APP_ENV === "local";
}

export function developEnv(): boolean {
  return REACT_APP_ENV === "development" || localEnv();
}

/**
 * is enterprise edition
 */
// Falk: TODO: check EE by API Call
export function isEE(): boolean {
  return REACT_APP_EDITION === "enterprise" || REACT_APP_EDITION === "enterprise-global";
}

export function isSaasMode(config?: SystemConfig) {
  return config?.workspaceMode === "SAAS" || config?.workspaceMode === "MULTIWORSPACE";
}

export function isEnterpriseMode(config?: SystemConfig) {
  return config?.workspaceMode === "ENTERPRISE" || config?.workspaceMode === "SINGLEWORKSPACE";
}

export function isSelfDomain(config?: SystemConfig) {
  return config?.selfDomain;
}

export function showAuditLog(config?: SystemConfig) {
  return config?.featureFlag?.enableAuditLog;
}

export function useCloudHosting() {
  const systemConfig = useSelector(selectSystemConfig);
  return systemConfig?.cloudHosting ?? true;
}

/* export function useSubscription(type: SubscriptionProducts): boolean {
  const { subscriptions, subscriptionDataLoaded, subscriptionDataError } = useCheckSubscriptions();
  if (!subscriptionDataLoaded || subscriptionDataError) {
    return false;
  }
  return subscriptions.some(subscription => subscription.product === type);
} */
