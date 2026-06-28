const Grid = require('../models/Grid');
const GridRow = require('../models/GridRow');

/**
 * Reusable Grid Service — all business logic for grid CRUD.
 * Decoupled from Express so it can be used in tests or other contexts.
 */
class GridService {
  /**
   * Get or create a grid by name. Used for seeding defaults.
   */
  async getOrCreateGrid(name, columns, description = '') {
    let grid = await Grid.findOne({ name });
    if (!grid) {
      try {
        grid = await Grid.create({ name, columns, description });
      } catch (err) {
        // Handle race condition (e.g., React StrictMode double-mount)
        if (err.code === 11000) {
          grid = await Grid.findOne({ name });
        } else {
          throw err;
        }
      }
    }
    return grid;
  }

  /**
   * Get a grid by ID with all its rows.
   */
  async getGrid(gridId) {
    const grid = await Grid.findById(gridId);
    if (!grid) {
      const error = new Error('Grid not found');
      error.statusCode = 404;
      throw error;
    }

    const rows = await GridRow.find({ gridId }).sort({ order: 1, createdAt: 1 });

    return { grid, rows };
  }

  /**
   * Get all available grids (metadata only, no rows).
   */
  async getAllGrids() {
    return Grid.find().sort({ createdAt: -1 });
  }

  /**
   * Get rows for a grid with optional search across all data fields.
   */
  async getRows(gridId, { search = '', page = 1, limit = 100 } = {}) {
    const query = { gridId };

    // If search term provided, build a text search across all data fields
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      // Get the grid's columns to know which fields to search
      const grid = await Grid.findById(gridId);
      if (grid && grid.columns.length > 0) {
        query.$or = grid.columns.map((col) => ({
          [`data.${col.key}`]: searchRegex,
        }));
      }
    }

    const total = await GridRow.countDocuments(query);
    const rows = await GridRow.find(query)
      .sort({ order: 1, createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { rows, total, page, limit };
  }

  /**
   * Create a new row in a grid.
   */
  async createRow(gridId, data = {}) {
    // Verify grid exists
    const grid = await Grid.findById(gridId);
    if (!grid) {
      const error = new Error('Grid not found');
      error.statusCode = 404;
      throw error;
    }

    // Initialize empty data for each column if not provided
    const initialData = {};
    grid.columns.forEach((col) => {
      initialData[col.key] = data[col.key] !== undefined ? data[col.key] : '';
    });

    // Determine order (append to end)
    const lastRow = await GridRow.findOne({ gridId }).sort({ order: -1 });
    const order = lastRow ? lastRow.order + 1 : 0;

    const row = await GridRow.create({
      gridId,
      data: initialData,
      order,
    });

    return row;
  }

  /**
   * Update a row's data (partial update — merges with existing data).
   */
  async updateRow(rowId, data) {
    const row = await GridRow.findById(rowId);
    if (!row) {
      const error = new Error('Row not found');
      error.statusCode = 404;
      throw error;
    }

    // Merge new data with existing data
    row.data = { ...row.data, ...data };
    row.markModified('data'); // Required for Mixed type
    await row.save();

    return row;
  }

  /**
   * Delete a row.
   */
  async deleteRow(rowId) {
    const row = await GridRow.findByIdAndDelete(rowId);
    if (!row) {
      const error = new Error('Row not found');
      error.statusCode = 404;
      throw error;
    }
    return row;
  }

  /**
   * Seed a grid with the given name (or default "Queries and Responses").
   */
  async seedDefaultGrid(gridName) {
    const columns = [
      { key: 'query', label: 'Query', type: 'textarea', required: false },
      { key: 'response', label: 'Response', type: 'textarea', required: false },
    ];

    const name = gridName || 'Queries and Responses';
    const desc = gridName
      ? `Version-scoped grid: ${gridName}`
      : 'A dynamic grid for managing queries and their responses.';

    const grid = await this.getOrCreateGrid(name, columns, desc);

    return grid;
  }
}

module.exports = new GridService();
