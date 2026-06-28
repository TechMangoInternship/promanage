const mongoose = require('mongoose');

/**
 * GridRow Model — stores a single row of dynamic data.
 *
 * `data` uses Schema.Types.Mixed so it can hold any JSON shape.
 * For the Queries & Responses grid, data will look like:
 *   { query: "What is MERN?", response: "MongoDB, Express, React, Node" }
 *
 * For a future "Task Tracker" grid it could look like:
 *   { title: "Fix bug", assignee: "Alice", status: "In Progress" }
 */
const gridRowSchema = new mongoose.Schema(
  {
    gridId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grid',
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    minimize: false, // preserve empty objects in data
  }
);

// Compound index for efficient queries
gridRowSchema.index({ gridId: 1, order: 1 });

module.exports = mongoose.model('GridRow', gridRowSchema);
