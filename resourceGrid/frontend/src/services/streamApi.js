import axios from 'axios';

const API_URL = 'http://localhost:5007/api/streams';
const FEATURES_API_URL = 'http://localhost:5006/api/features';

const streamApi = {
  seed: async (projectName, version) => {
    const response = await axios.post(`${API_URL}/seed`, {
      projectName: projectName || '',
      version: version || ''
    });
    return response.data;
  },

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

  fetchTotalFeatureHours: async (projectName, version) => {
    try {
      const response = await axios.get(FEATURES_API_URL, {
        params: {
          projectName: projectName || '',
          version: version || ''
        }
      });
      const features = response.data || [];
      let total = 0;
      for (const f of features) {
        const hours = parseFloat(f.effortsHours);
        if (!isNaN(hours)) {
          total += hours;
        }
      }
      return total;
    } catch {
      return 0;
    }
  }
};

export default streamApi;
