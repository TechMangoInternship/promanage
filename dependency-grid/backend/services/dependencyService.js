const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', '..', 'data.json');

const loadDependencies = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.map(d => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt)
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveDependencies = (dependencies) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(dependencies, null, 2), 'utf8');
};

const getAllDependencies = async (projectName = '', version = '', searchQuery = '') => {
  let dependencies = loadDependencies();
  let result = dependencies.filter(d => (d.projectName || '') === (projectName || '') && (d.version || '') === (version || ''));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(d => d.text.toLowerCase().includes(q));
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
};

const getDependencyById = async (id) => {
  let dependencies = loadDependencies();
  return dependencies.find(d => d._id === id);
};

const createDependency = async (data) => {
  let dependencies = loadDependencies();
  const dependency = {
    _id: crypto.randomUUID(),
    projectName: data.projectName || '',
    version: data.version || '',
    text: data.text,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  dependencies.push(dependency);
  saveDependencies(dependencies);
  return dependency;
};

const updateDependency = async (id, data) => {
  let dependencies = loadDependencies();
  const index = dependencies.findIndex(d => d._id === id);
  if (index !== -1) {
    dependencies[index] = { ...dependencies[index], text: data.text, updatedAt: new Date() };
    saveDependencies(dependencies);
    return dependencies[index];
  }
  return null;
};

const deleteDependency = async (id) => {
  let dependencies = loadDependencies();
  const index = dependencies.findIndex(d => d._id === id);
  if (index !== -1) {
    const deleted = dependencies[index];
    dependencies.splice(index, 1);
    saveDependencies(dependencies);
    return deleted;
  }
  return null;
};

module.exports = {
  getAllDependencies,
  getDependencyById,
  createDependency,
  updateDependency,
  deleteDependency,
};
