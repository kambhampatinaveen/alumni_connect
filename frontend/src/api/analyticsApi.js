import apiClient from './client';

export const getOverview = async (params = {}) => {
  return apiClient.get('/analytics/overview', { params });
};

export const getByDepartment = async () => {
  return apiClient.get('/analytics/by-department');
};

export const getByIndustry = async () => {
  return apiClient.get('/analytics/by-industry');
};

export const getEngagementTrend = async (params = {}) => {
  return apiClient.get('/analytics/engagement-trend', { params });
};

export const getMentorshipDomains = async () => {
  return apiClient.get('/analytics/mentorship-domains');
};

export const getEventParticipation = async () => {
  return apiClient.get('/analytics/event-participation');
};
