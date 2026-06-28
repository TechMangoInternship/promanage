import axios from "axios";

const BASE = "/api/projects";

export const fetchProjects    = ()              => axios.get(BASE);
export const createProject    = (data)          => axios.post(BASE, data);
export const insertProject    = (data)          => axios.post(`${BASE}/insert`, data);
export const updateProject    = (id, data)      => axios.put(`${BASE}/${id}`, data);
export const updateCell       = (id, col, val)  => axios.patch(`${BASE}/${id}/cell`, { col, value: val });
export const deleteProject    = (id)            => axios.delete(`${BASE}/${id}`);

// ── Version management ──────────────────────────────────────────
export const addVersion       = (id, versionName) =>   axios.post(`${BASE}/${id}/versions`, { versionName });
export const deleteVersion    = (id, versionId) =>     axios.delete(`${BASE}/${id}/versions/${versionId}`);
export const updateVersion    = (id, versionId, versionName) =>
  axios.put(`${BASE}/${id}/versions/${versionId}`, { versionName });

export default axios;