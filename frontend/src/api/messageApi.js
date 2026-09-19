import api from '../lib/api';

export const getConversations = () => api.get('/messages/conversations');
export const getMessages = (mentorshipId) => api.get(`/messages/${mentorshipId}`);
export const sendMessage = (mentorshipId, text) => api.post('/messages', { mentorshipId, text });
export const markMessagesRead = (mentorshipId) => api.put(`/messages/${mentorshipId}/read`);
export const getUnreadMessageCount = () => api.get('/messages/unread-count');
