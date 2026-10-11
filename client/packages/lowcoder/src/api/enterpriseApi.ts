import axios from 'axios';

export interface FetchBrandingSettingPayload {
  orgId?: string;
  fallbackToGlobal?: boolean;
}
export interface BrandingSettings {
  logo?: string | null;
  squareLogo?: string | null;
  mainBrandingColor?: string;
  appHeaderColor?: string;
  adminSidebarColor?: string;
  adminSidebarFontColor?: string;
  adminSidebarActiveBgColor?: string;
  adminSidebarActiveFontColor?: string;
  editorSidebarColor?: string;
  editorSidebarFontColor?: string;
  editorSidebarActiveBgColor?: string;
  editorSidebarActiveFontColor?: string;
  font?: string;
  errorPageText?: string;
  errorPageImage?: string | null;
  signUpPageText?: string;
  signUpPageImage?: string | null;
  loggedOutPageText?: string;
  loggedOutPageImage?: string | null;
  standardDescription?: string;
  standardTitle?: string;
  showDocumentation?: boolean;
  documentationLink?: string | null;
  submitIssue?: boolean;
  whatsNew?: boolean;
  whatsNewLink?: string | null;
}
export interface BrandingConfig {
  config_name?: string,
  config_description?: string,
  config_icon?: string,
  config_set?: BrandingSettings,
  orgId?: string,
  user_id?: string,
  id?: string,
}

export interface BrandingSettingResponse extends BrandingConfig {};

export interface EnterpriseLicenseResponse {
  eeActive: boolean;
  remainingAPICalls: number;
  eeLicenses: Array<{
    uuid: string;
    issuedTo: string;
    apiCallsLimit: number;
  }>;
}

// Existing functions
export const getEnterpriseLicense = async () => {
  const response = await axios.get('/api/plugins/enterprise/license');
  return response.data;
};

export const getAuditLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axios.get(`/api/plugins/enterprise/audit-logs${query ? `?${query}` : ''}`);
  return response.data;
};

export const getAuditLogStatistics = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axios.get(`/api/plugins/enterprise/audit-logs/statistics?groupByParam=eventTypeId${query ? `&${query}` : ''}`);
  return response.data;
};

export const getMeta = async (formData = {}) => {
  const response = await axios.post(`/api/meta/`, formData);
  return response.data;
}

export const getEnvironmentsByIds = async (formData: string[] = []) => {
  const response = await axios.post(`/api/plugins/enterprise/environments/byIds`, formData);
  return response.data;
}

export const getAppUsageLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await axios.get(`/api/plugins/enterprise/app-usage-logs${query ? `?${query}` : ''}`);
  return response.data;
};

export const getAppUsageStatistics = async (groupByParam : string) => {
  const response = await axios.get(`/api/plugins/enterprise/app-usage-logs/statistics?groupByParam=${groupByParam}`);
  return response.data;
};


export const getBranding = async (orgId: string = '') => {
  const response = await axios.get('/api/plugins/enterprise/branding?orgId='+orgId);
  const data = response.data;
  if (Boolean(data.error)) {
    return {};
  }
  return {
    ...data,
    config_set: data?.config_set ? JSON.parse(data.config_set) : {},
  };
};

export const createBranding = async (brandingData : any) => {
  let response;
  if (brandingData.id) {
    response = await axios.put(`/api/plugins/enterprise/branding?brandId=${brandingData.id}`, brandingData);
  } else {
    response = await axios.post('/api/plugins/enterprise/branding', brandingData);
  }
  return response.data;
};

export const updateBranding = async (brandingData : any) => {
  const response = await axios.put('/api/plugins/enterprise/branding', brandingData);
  return response.data;
};
