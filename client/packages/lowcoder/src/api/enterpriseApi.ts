import axios from 'axios';

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

export const getAuditLogStatistics = async (groupByParam : string) => {
    const response = await axios.get(`/api/plugins/enterprise/audit-logs/statistics?groupByParam=${groupByParam}`);
    return response.data;
};

export const getAppUsageLogs = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`/api/plugins/enterprise/app-usage-logs${query ? `?${query}` : ''}`);
    return response.data;
};

export const getAppUsageStatistics = async (groupByParam : string) => {
    const response = await axios.get(`/api/plugins/enterprise/app-usage-logs/statistics?groupByParam=${groupByParam}`);
    return response.data;
};


export const getBranding = async () => {
    const response = await axios.get('/api/plugins/enterprise/branding');
    return response.data;
};

export const createBranding = async (brandingData : any) => {
    const response = await axios.post('/api/plugins/enterprise/branding', brandingData);
    return response.data;
};

export const updateBranding = async (brandingData : any) => {
    const response = await axios.put('/api/plugins/enterprise/branding', brandingData);
    return response.data;
};
