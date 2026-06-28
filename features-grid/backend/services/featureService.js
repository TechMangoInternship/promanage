const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', '..', 'data.json');

const loadFeatures = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.map(f => ({
        ...f,
        createdAt: new Date(f.createdAt),
        updatedAt: new Date(f.updatedAt)
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveFeatures = (features) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(features, null, 2), 'utf8');
};

const getAllFeatures = async (projectName = '', version = '', searchQuery = '') => {
  let features = loadFeatures();
  // Filter by projectName and version context
  let result = features.filter(f => (f.projectName || '') === (projectName || '') && (f.version || '') === (version || ''));
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(f => 
      (f.platform || '').toLowerCase().includes(q) ||
      (f.module || '').toLowerCase().includes(q) ||
      (f.subModule || '').toLowerCase().includes(q) ||
      (f.question || '').toLowerCase().includes(q) ||
      (f.answer || '').toLowerCase().includes(q) ||
      (f.effortsHours || '').toLowerCase().includes(q)
    );
  }
  return result.sort((a, b) => b.createdAt - a.createdAt);
};

const createFeature = async (data) => {
  let features = loadFeatures();
  const feature = {
    _id: crypto.randomUUID(),
    projectName: data.projectName || '',
    version: data.version || '',
    platform: data.platform || '',
    module: data.module || '',
    subModule: data.subModule || '',
    question: data.question || '',
    answer: data.answer || '',
    effortsHours: data.effortsHours || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  features.push(feature);
  saveFeatures(features);
  return feature;
};

const updateFeature = async (id, data) => {
  let features = loadFeatures();
  const index = features.findIndex(f => f._id === id);
  if (index !== -1) {
    features[index] = {
      ...features[index],
      platform: data.platform !== undefined ? data.platform : features[index].platform,
      module: data.module !== undefined ? data.module : features[index].module,
      subModule: data.subModule !== undefined ? data.subModule : features[index].subModule,
      question: data.question !== undefined ? data.question : features[index].question,
      answer: data.answer !== undefined ? data.answer : features[index].answer,
      effortsHours: data.effortsHours !== undefined ? data.effortsHours : features[index].effortsHours,
      updatedAt: new Date()
    };
    saveFeatures(features);
    return features[index];
  }
  return null;
};

const deleteFeature = async (id) => {
  let features = loadFeatures();
  const index = features.findIndex(f => f._id === id);
  if (index !== -1) {
    const deleted = features[index];
    features.splice(index, 1);
    saveFeatures(features);
    return deleted;
  }
  return null;
};

module.exports = {
  getAllFeatures,
  createFeature,
  updateFeature,
  deleteFeature,
};
