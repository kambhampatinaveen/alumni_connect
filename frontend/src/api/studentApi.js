import api from '../lib/api';

export const getStudentsList = async () => {
  const res = await api.get('/students');
  return res;
};

export const getStudents = async (params = {}) => {
  return api.get('/students', { params });
};

export const addStudent = async (data) => {
  return api.post('/students', data);
};

export const updateStudent = async (id, data) => {
  return api.put(`/students/${id}`, data);
};

export const deleteStudent = async (id) => {
  return api.delete(`/students/${id}`);
};

export default {
  getStudentsList,
  getStudents,
  addStudent,
  updateStudent,
  deleteStudent
};
