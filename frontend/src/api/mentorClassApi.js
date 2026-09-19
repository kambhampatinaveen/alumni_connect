import api from '../lib/api';

export const getMentorClasses = () => api.get('/mentor-classes');
export const createMentorClass = (data) => api.post('/mentor-classes', data);
