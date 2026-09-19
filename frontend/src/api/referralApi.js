import api from '../lib/api';

export const getReferrals = () => api.get('/referrals');
export const getReferralById = (id) => api.get(`/referrals/${id}`);
export const submitReferral = (data) => api.post('/referrals', data);
export const createReferral = (data) => api.post('/referrals', data);
export const updateReferral = (id, data) => api.put(`/referrals/${id}`, data);
export const updateReferralStatus = (id, status) => api.put(`/referrals/${id}`, { status });
