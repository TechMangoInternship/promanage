const streamService = require('../services/streamService');

const getAll = async (req, res) => {
  try {
    const { projectName, version, search } = req.query;
    const streams = await streamService.getAllStreams(projectName, version, search);
    res.status(200).json(streams);
  } catch (error) {
    console.error('Error fetching streams:', error.message);
    res.status(500).json({ message: 'Failed to fetch streams', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { projectName, version, streamName, percentage } = req.body;
    const stream = await streamService.createStream({
      projectName,
      version,
      streamName,
      percentage
    });
    res.status(201).json(stream);
  } catch (error) {
    console.error('Error creating stream:', error.message);
    res.status(500).json({ message: 'Failed to create stream', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { streamName, percentage } = req.body;
    const stream = await streamService.updateStream(id, { streamName, percentage });
    if (!stream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (stream.error) {
      return res.status(403).json({ message: stream.error });
    }
    res.status(200).json(stream);
  } catch (error) {
    console.error('Error updating stream:', error.message);
    res.status(500).json({ message: 'Failed to update stream', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await streamService.deleteStream(id);
    if (!result) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (result.error) {
      return res.status(403).json({ message: result.error });
    }
    res.status(200).json({ message: 'Stream deleted successfully' });
  } catch (error) {
    console.error('Error deleting stream:', error.message);
    res.status(500).json({ message: 'Failed to delete stream', error: error.message });
  }
};

const seed = async (req, res) => {
  try {
    const { projectName, version } = req.body;
    const streams = await streamService.seedDefaults(projectName, version);
    res.status(200).json(streams);
  } catch (error) {
    console.error('Error seeding streams:', error.message);
    res.status(500).json({ message: 'Failed to seed streams', error: error.message });
  }
};

module.exports = { getAll, create, update, remove, seed };
