import axios from 'axios';

export const getEnterpriseLicense = async () => {
    const response = await axios.get('/api/plugins/enterprise/license');
    return response.data;
};

export const getAuditLogs = async () => {
    const response = await axios.get('/api/plugins/enterprise/audit-logs');
    return response.data;
};

export const getAuditLogStatistics = async (groupByParam: string) => {
    const response = await axios.get(`/api/plugins/enterprise/audit-logs/statistics?groupByParam=${groupByParam}`);
    return response.data;
};

export const getAppUsageLogs = async () => {
    const response = await axios.get('/api/plugins/enterprise/app-usage-logs');
    return response.data;
};

export const getAppUsageStatistics = async (groupByParam: string) => {
    const response = await axios.get(`/api/plugins/enterprise/app-usage-logs/statistics?groupByParam=${groupByParam}`);
    return response.data;
};
