import api from '../lib/api';

export const getAlumni = async (params = {}) => {
  return api.get('/alumni', { params });
};

export const addAlumnus = async (data) => {
  return api.post('/alumni', data);
};

export const updateAlumnus = async (id, data) => {
  return api.put(`/alumni/${id}`, data);
};

export const deleteAlumnus = async (id) => {
  return api.delete(`/alumni/${id}`);
};

export const addAlumni = addAlumnus;
export const updateAlumni = updateAlumnus;
export const deleteAlumni = deleteAlumnus;

export default {
  getAlumni,
  addAlumnus,
  updateAlumnus,
  deleteAlumnus,
  addAlumni,
  updateAlumni,
  deleteAlumni
};
