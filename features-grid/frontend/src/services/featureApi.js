import axios from 'axios';

const API_URL = '/api/features';

const featureApi = {
  getAll: async (projectName, version, search = '') => {
    const params = {
      projectName: projectName || '',
      version: version || '',
      search
    };
    const response = await axios.get(API_URL, { params });
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};

export default featureApi;
