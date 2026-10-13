import Api from "api/api";
import { isPublicLowcoderCloud } from "util/enterpriseHosting";
import { ERROR_CODES } from "constants/apiConstants";

export interface LicenseContactData {
  companyName: string;
  address: string;
  registerNumber: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxId?: string;
  vatId?: string;
}
export interface LicenseRequestData {
  requestId: string;
  orgId: string;
  contactData: LicenseContactData;
  billingInterval: "month" | "year";
  deploymentIds: string[];
}
export interface EnterpriseLicenseFile {
  id: string;
  filename: string;
  deploymentId: string;
  notBefore: string;
  notAfter: string;
}
export interface EnterpriseLicenseOrder {
  requestId: string;
  companyName: string;
  billingInterval: "month" | "year";
  deploymentIds: string[];
  status: string;
  checkoutUrl?: string;
}
export interface EnterpriseLicenseStatus {
  orders: EnterpriseLicenseOrder[];
  licenses: EnterpriseLicenseFile[];
}

export class EnterpriseLicenseRequestError extends Error {
  constructor(message: string, readonly retryable = true, readonly retryAfterMs = 0) {
    super(message);
    this.name = "EnterpriseLicenseRequestError";
  }
}

function requestError(response?: { status?: number; headers?: Record<string, any> }) {
  const status = response?.status;
  const retryable = !status || status === 408 || status === 429 || status >= 500;
  const retryAfter = response?.headers?.["retry-after"];
  const retryAfterMs = retryAfter ? Math.max(0, Number.isFinite(Number(retryAfter))
    ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now()) : 0;
  return new EnterpriseLicenseRequestError(status === 401 || status === 403
    ? "Your session no longer has permission to manage these licenses. Sign in as the purchasing workspace admin."
    : retryable ? "The license service is temporarily unavailable. We will retry automatically; you can also refresh manually."
    : "Licenses could not be refreshed. Check your installation's licensing configuration and try again.",
    retryable, Number.isFinite(retryAfterMs) ? retryAfterMs : 0);
}

async function request<T>(action: string, body: object): Promise<T> {
  if (isPublicLowcoderCloud()) {
    throw new Error("Enterprise licenses are available from your self-hosted Lowcoder installation.");
  }
  try {
    const response = await Api.post(`/enterprise-licenses/${action}`, { ...body, returnOrigin: window.location.origin }, undefined, { timeout: 120000 });
    // The shared interceptor resolves some HTTP failures instead of rejecting them.
    if (response?.status >= 400) throw requestError(response);
    const result = response?.data?.data;
    if (!result || result.success !== true || ((action === "status" || action === "sync") &&
      (!Array.isArray(result.orders) || !Array.isArray(result.licenses)))) throw requestError();
    return result as T;
  } catch (error) {
    if (error instanceof EnterpriseLicenseRequestError) throw error;
    const failure = error as { response?: { status?: number; headers?: Record<string, any> }; code?: string };
    throw requestError(failure?.code === ERROR_CODES.REQUEST_NOT_AUTHORISED ? { status: 401 } : failure?.response);
  }
}

export const submitLicenseRequest = (data: LicenseRequestData) =>
  request<{ success: true; requestId: string; checkoutUrl: string }>("checkout", data);
export const getLicenseRequestStatus = (orgId: string, refresh = false) =>
  request<EnterpriseLicenseStatus>("status", { orgId, ...(refresh ? { refresh: true } : {}) });
export const synchronizeEnterpriseLicenses = (orgId: string) => request<EnterpriseLicenseStatus>("sync", { orgId });
export const getEnterpriseLicenseFile = (orgId: string, licenseId: string) =>
  request<{ filename: string; license: string }>("download", { orgId, licenseId });
export const getEnterpriseBillingPortal = (orgId: string, requestId: string) =>
  request<{ url: string }>("portal", { orgId, requestId });

export function openStripePage(url: string, kind: "checkout" | "portal") {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.username || target.password || target.port || ![kind === "checkout" ? "checkout.stripe.com" : "billing.stripe.com", "secure.lowcoder.cloud"].includes(target.hostname)) {
    throw new Error("Invalid Stripe destination");
  }
  window.location.assign(target.href);
}
