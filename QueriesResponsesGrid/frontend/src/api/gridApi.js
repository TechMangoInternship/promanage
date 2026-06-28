import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for error normalization
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

/**
 * Grid API functions
 */
export const gridApi = {
  // Seed the default grid (optionally with a version-scoped name)
  seedGrid: (name) => api.post('/grids/seed', { name }),

  // Get all grids
  getAllGrids: () => api.get('/grids'),

  // Get a grid with all rows
  getGrid: (gridId) => api.get(`/grids/${gridId}`),

  // Get rows with optional search
  getRows: (gridId, params = {}) =>
    api.get(`/grids/${gridId}/rows`, { params }),

  // Create a new row
  createRow: (gridId, data = {}) =>
    api.post(`/grids/${gridId}/rows`, { data }),

  // Update a row
  updateRow: (rowId, data) =>
    api.put(`/grids/rows/${rowId}`, { data }),

  // Delete a row
  deleteRow: (rowId) => api.delete(`/grids/rows/${rowId}`),

  // Generate share links for all rows in a grid
  generateLinks: (gridId) =>
    api.post('/share/generate', { gridId }),
};

export default gridApi;
