const assumptionService = require('../services/assumptionService');

/**
 * GET /api/assumptions
 * Supports ?search=<query> query parameter.
 */
const getAll = async (req, res) => {
  try {
    const { projectName, version, search } = req.query;
    const assumptions = await assumptionService.getAllAssumptions(projectName, version, search);
    res.status(200).json(assumptions);
  } catch (error) {
    console.error('Error fetching assumptions:', error.message);
    res.status(500).json({ message: 'Failed to fetch assumptions', error: error.message });
  }
};

/**
 * POST /api/assumptions
 */
const create = async (req, res) => {
  try {
    const { projectName, version, text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Assumption text is required' });
    }
    const assumption = await assumptionService.createAssumption({ projectName, version, text: text.trim() });
    res.status(201).json(assumption);
  } catch (error) {
    console.error('Error creating assumption:', error.message);
    res.status(500).json({ message: 'Failed to create assumption', error: error.message });
  }
};

/**
 * PUT /api/assumptions/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Assumption text is required' });
    }
    const assumption = await assumptionService.updateAssumption(id, { text: text.trim() });
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }
    res.status(200).json(assumption);
  } catch (error) {
    console.error('Error updating assumption:', error.message);
    res.status(500).json({ message: 'Failed to update assumption', error: error.message });
  }
};

/**
 * DELETE /api/assumptions/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const assumption = await assumptionService.deleteAssumption(id);
    if (!assumption) {
      return res.status(404).json({ message: 'Assumption not found' });
    }
    res.status(200).json({ message: 'Assumption deleted successfully' });
  } catch (error) {
    console.error('Error deleting assumption:', error.message);
    res.status(500).json({ message: 'Failed to delete assumption', error: error.message });
  }
};

module.exports = { getAll, create, update, remove };
