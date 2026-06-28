const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', '..', 'data.json');

const DEFAULT_STREAMS = [
  'Testing',
  'Project Management',
  'UI/UX',
  'Contingency',
  'Data Warehousing'
];

const loadStreams = () => {
  if (fs.existsSync(dataFilePath)) {
    try {
      const data = fs.readFileSync(dataFilePath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));
    } catch (e) {
      return [];
    }
  }
  return [];
};

const saveStreams = (streams) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(streams, null, 2), 'utf8');
};

const seedDefaults = async (projectName = '', version = '') => {
  const pName = projectName || '';
  const ver = version || '';
  let streams = loadStreams();

  // Check which default streams already exist for this project/version
  const existing = streams.filter(
    s => (s.projectName || '') === pName && (s.version || '') === ver && s.isDefault === true
  );
  const existingNames = existing.map(s => s.streamName);

  // Create missing defaults
  const missing = DEFAULT_STREAMS.filter(name => !existingNames.includes(name));
  for (const name of missing) {
    streams.push({
      _id: crypto.randomUUID(),
      projectName: pName,
      version: ver,
      streamName: name,
      percentage: 0,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  if (missing.length > 0) {
    saveStreams(streams);
  }

  // Return all streams for this project/version
  return streams
    .filter(s => (s.projectName || '') === pName && (s.version || '') === ver)
    .sort((a, b) => a.createdAt - b.createdAt);
};

const getAllStreams = async (projectName = '', version = '', searchQuery = '') => {
  let streams = loadStreams();
  let result = streams.filter(
    s => (s.projectName || '') === (projectName || '') && (s.version || '') === (version || '')
  );

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(s =>
      (s.streamName || '').toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => a.createdAt - b.createdAt);
};

const createStream = async (data) => {
  let streams = loadStreams();
  const stream = {
    _id: crypto.randomUUID(),
    projectName: data.projectName || '',
    version: data.version || '',
    streamName: data.streamName || '',
    percentage: parseFloat(data.percentage) || 0,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  streams.push(stream);
  saveStreams(streams);
  return stream;
};

const updateStream = async (id, data) => {
  let streams = loadStreams();
  const index = streams.findIndex(s => s._id === id);
  if (index === -1) return null;

  const existing = streams[index];

  // For default streams, only allow percentage update
  if (existing.isDefault) {
    streams[index] = {
      ...existing,
      percentage: data.percentage !== undefined ? parseFloat(data.percentage) || 0 : existing.percentage,
      updatedAt: new Date()
    };
  } else {
    // For custom streams, allow name and percentage updates
    streams[index] = {
      ...existing,
      streamName: data.streamName !== undefined ? data.streamName : existing.streamName,
      percentage: data.percentage !== undefined ? parseFloat(data.percentage) || 0 : existing.percentage,
      updatedAt: new Date()
    };
  }

  saveStreams(streams);
  return streams[index];
};

const deleteStream = async (id) => {
  let streams = loadStreams();
  const index = streams.findIndex(s => s._id === id);
  if (index === -1) return null;

  // Prevent deletion of default streams
  if (streams[index].isDefault) {
    return { error: 'Cannot delete default stream rows' };
  }

  const deleted = streams[index];
  streams.splice(index, 1);
  saveStreams(streams);
  return deleted;
};

module.exports = {
  seedDefaults,
  getAllStreams,
  createStream,
  updateStream,
  deleteStream,
};
