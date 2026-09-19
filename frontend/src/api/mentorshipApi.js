import api from '../lib/api';

export const getMentorships = () => api.get('/mentorships');
export const getMentorshipById = (id) => api.get(`/mentorships/${id}`);
export const requestMentorship = (data) => api.post('/mentorships', data);
export const updateMentorship = (id, data) => api.put(`/mentorships/${id}`, data);
export const addMentorshipSession = (id, data) => api.post(`/mentorships/${id}/sessions`, data);
