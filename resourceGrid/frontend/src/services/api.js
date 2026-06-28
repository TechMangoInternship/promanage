import axios from "axios";

const BASE = "/api/resources";

export const getAllResources = (projectName, version) => {
  const params = {};
  if (projectName) params.projectName = projectName;
  if (version) params.version = version;
  return axios.get(BASE, { params });
};
export const createResource = (data) => axios.post(BASE, data);
export const insertResource = (data) => axios.post(`${BASE}/insert`, data);
export const updateResource = (id, data) => axios.put(`${BASE}/${id}`, data);
export const updateCell = (id, col, value) =>
  axios.patch(`${BASE}/${id}/cell`, { col, value });
export const deleteResource = (id) => axios.delete(`${BASE}/${id}`);
