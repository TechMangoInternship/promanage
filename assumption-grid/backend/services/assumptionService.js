const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', '..', 'data.json');

const loadAssumptions = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.map(a => ({
        ...a,
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt)
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveAssumptions = (assumptions) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(assumptions, null, 2), 'utf8');
};

const getAllAssumptions = async (projectName = '', version = '', searchQuery = '') => {
  let assumptions = loadAssumptions();
  let result = assumptions.filter(a => (a.projectName || '') === (projectName || '') && (a.version || '') === (version || ''));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(a => a.text.toLowerCase().includes(q));
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
};

const getAssumptionById = async (id) => {
  let assumptions = loadAssumptions();
  return assumptions.find(a => a._id === id);
};

const createAssumption = async (data) => {
  let assumptions = loadAssumptions();
  const assumption = {
    _id: crypto.randomUUID(),
    projectName: data.projectName || '',
    version: data.version || '',
    text: data.text,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  assumptions.push(assumption);
  saveAssumptions(assumptions);
  return assumption;
};

const updateAssumption = async (id, data) => {
  let assumptions = loadAssumptions();
  const index = assumptions.findIndex(a => a._id === id);
  if (index !== -1) {
    assumptions[index] = { ...assumptions[index], text: data.text, updatedAt: new Date() };
    saveAssumptions(assumptions);
    return assumptions[index];
  }
  return null;
};

const deleteAssumption = async (id) => {
  let assumptions = loadAssumptions();
  const index = assumptions.findIndex(a => a._id === id);
  if (index !== -1) {
    const deleted = assumptions[index];
    assumptions.splice(index, 1);
    saveAssumptions(assumptions);
    return deleted;
  }
  return null;
};

module.exports = {
  getAllAssumptions,
  getAssumptionById,
  createAssumption,
  updateAssumption,
  deleteAssumption,
};
