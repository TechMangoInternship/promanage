const dependencyService = require('../services/dependencyService');

/**
 * GET /api/dependencies
 * Supports ?search=<query> query parameter.
 */
const getAll = async (req, res) => {
  try {
    const { projectName, version, search } = req.query;
    const dependencies = await dependencyService.getAllDependencies(projectName, version, search);
    res.status(200).json(dependencies);
  } catch (error) {
    console.error('Error fetching dependencies:', error.message);
    res.status(500).json({ message: 'Failed to fetch dependencies', error: error.message });
  }
};

/**
 * POST /api/dependencies
 */
const create = async (req, res) => {
  try {
    const { projectName, version, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Dependency text is required' });
    }
    const dependency = await dependencyService.createDependency({ projectName, version, text: text.trim() });
    res.status(201).json(dependency);
  } catch (error) {
    console.error('Error creating dependency:', error.message);
    res.status(500).json({ message: 'Failed to create dependency', error: error.message });
  }
};

/**
 * PUT /api/dependencies/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Dependency text is required' });
    }
    const dependency = await dependencyService.updateDependency(id, { text: text.trim() });
    if (!dependency) {
      return res.status(404).json({ message: 'Dependency not found' });
    }
    res.status(200).json(dependency);
  } catch (error) {
    console.error('Error updating dependency:', error.message);
    res.status(500).json({ message: 'Failed to update dependency', error: error.message });
  }
};

/**
 * DELETE /api/dependencies/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const dependency = await dependencyService.deleteDependency(id);
    if (!dependency) {
      return res.status(404).json({ message: 'Dependency not found' });
    }
    res.status(200).json({ message: 'Dependency deleted successfully' });
  } catch (error) {
    console.error('Error deleting dependency:', error.message);
    res.status(500).json({ message: 'Failed to delete dependency', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
