import apiClient from './client';

// Alumni API
export const getAlumni = async (params = {}) => apiClient.get('/alumni', { params });
export const addAlumnus = async (data) => apiClient.post('/alumni', data);
export const updateAlumnus = async (id, data) => apiClient.put(`/alumni/${id}`, data);
export const deleteAlumnus = async (id) => apiClient.delete(`/alumni/${id}`);

// Students API
export const getStudents = async (params = {}) => apiClient.get('/students', { params });
export const addStudent = async (data) => apiClient.post('/students', data);
export const updateStudent = async (id, data) => apiClient.put(`/students/${id}`, data);
export const deleteStudent = async (id) => apiClient.delete(`/students/${id}`);

// Events API
export const getEvents = async (params = {}) => apiClient.get('/events', { params });
export const addEvent = async (data) => apiClient.post('/events', data);
export const updateEvent = async (id, data) => apiClient.put(`/events/${id}`, data);
export const deleteEvent = async (id) => apiClient.delete(`/events/${id}`);
