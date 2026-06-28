const gridService = require('../services/gridService');

/**
 * Grid Controller — thin layer delegating to the service.
 */

// GET /api/grids
exports.getAllGrids = async (req, res, next) => {
  try {
    const grids = await gridService.getAllGrids();
    res.json({ success: true, data: grids });
  } catch (error) {
    next(error);
  }
};

// GET /api/grids/:gridId
exports.getGrid = async (req, res, next) => {
  try {
    const { grid, rows } = await gridService.getGrid(req.params.gridId);
    res.json({ success: true, data: { grid, rows } });
  } catch (error) {
    next(error);
  }
};

// GET /api/grids/:gridId/rows
exports.getRows = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const result = await gridService.getRows(req.params.gridId, {
      search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 100,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// POST /api/grids/:gridId/rows
exports.createRow = async (req, res, next) => {
  try {
    const row = await gridService.createRow(req.params.gridId, req.body.data);
    res.status(201).json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

// PUT /api/grids/rows/:rowId
exports.updateRow = async (req, res, next) => {
  try {
    const row = await gridService.updateRow(req.params.rowId, req.body.data);
    res.json({ success: true, data: row });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/grids/rows/:rowId
exports.deleteRow = async (req, res, next) => {
  try {
    await gridService.deleteRow(req.params.rowId);
    res.json({ success: true, message: 'Row deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/grids/seed
exports.seedGrid = async (req, res, next) => {
  try {
    const { name } = req.body;
    const grid = await gridService.seedDefaultGrid(name);
    res.status(201).json({ success: true, data: grid });
  } catch (error) {
    next(error);
  }
};
