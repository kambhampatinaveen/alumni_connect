import api from '../lib/api';

export const getEvents = () => api.get('/events');
export const getEventById = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const participate = (id) => api.post(`/events/${id}/participate`);
export const cancelParticipation = (id) => api.post(`/events/${id}/cancel`);
export const getParticipants = (id) => api.get(`/events/${id}/participants`);
export const deleteEvent = (id) => api.delete(`/events/${id}`);
