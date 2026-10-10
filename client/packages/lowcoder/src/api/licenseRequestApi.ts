import Api from "api/api";

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

async function request<T>(action: string, body: object): Promise<T> {
  const response = await Api.post(`/enterprise-licenses/${action}`, { ...body, returnOrigin: window.location.origin }, undefined, { timeout: 120000 });
  const result = response.data?.data;
  if (!result || result.success !== true) throw new Error("Enterprise licensing request was not confirmed");
  return result as T;
}

export const submitLicenseRequest = (data: LicenseRequestData) =>
  request<{ success: true; requestId: string; checkoutUrl: string }>("checkout", data);
export const getLicenseRequestStatus = (orgId: string) => request<EnterpriseLicenseStatus>("status", { orgId });
export const synchronizeEnterpriseLicenses = (orgId: string) => request<EnterpriseLicenseStatus>("sync", { orgId });
export const getEnterpriseLicenseFile = (orgId: string, licenseId: string) =>
  request<{ filename: string; license: string }>("download", { orgId, licenseId });
export const getEnterpriseBillingPortal = (orgId: string, requestId: string) =>
  request<{ url: string }>("portal", { orgId, requestId });

export function openStripePage(url: string, kind: "checkout" | "portal") {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.hostname !== (kind === "checkout" ? "checkout.stripe.com" : "billing.stripe.com")) {
    throw new Error("Invalid Stripe destination");
  }
  window.location.assign(target.href);
}
