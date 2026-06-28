const mongoose = require('mongoose');

/**
 * Grid Model — stores grid metadata and column configuration.
 * 
 * The columns array defines the shape of each row's data, but the actual
 * row data (GridRow) uses a schema-less Mixed type, so columns serve as
 * UI hints rather than strict validation constraints.
 */
const columnSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'textarea'],
      default: 'text',
    },
    width: {
      type: Number,
      default: null,
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const gridSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    columns: {
      type: [columnSchema],
      required: true,
      validate: {
        validator: (cols) => cols.length > 0,
        message: 'A grid must have at least one column.',
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Grid', gridSchema);
