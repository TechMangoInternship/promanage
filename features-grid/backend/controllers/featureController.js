const featureService = require('../services/featureService');

const getAll = async (req, res) => {
  try {
    const { projectName, version, search } = req.query;
    const features = await featureService.getAllFeatures(projectName, version, search);
    res.status(200).json(features);
  } catch (error) {
    console.error('Error fetching features:', error.message);
    res.status(500).json({ message: 'Failed to fetch features', error: error.message });
  }
};

const create = async (req, res) => {
  try {
    const { projectName, version, platform, module: mod, subModule, question, answer, effortsHours } = req.body;
    const feature = await featureService.createFeature({
      projectName,
      version,
      platform,
      module: mod,
      subModule,
      question,
      answer,
      effortsHours
    });
    res.status(201).json(feature);
  } catch (error) {
    console.error('Error creating feature:', error.message);
    res.status(500).json({ message: 'Failed to create feature', error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, module: mod, subModule, question, answer, effortsHours } = req.body;
    const feature = await featureService.updateFeature(id, {
      platform,
      module: mod,
      subModule,
      question,
      answer,
      effortsHours
    });
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }
    res.status(200).json(feature);
  } catch (error) {
    console.error('Error updating feature:', error.message);
    res.status(500).json({ message: 'Failed to update feature', error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await featureService.deleteFeature(id);
    if (!feature) {
      return res.status(404).json({ message: 'Feature not found' });
    }
    res.status(200).json({ message: 'Feature deleted successfully' });
  } catch (error) {
    console.error('Error deleting feature:', error.message);
    res.status(500).json({ message: 'Failed to delete feature', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
