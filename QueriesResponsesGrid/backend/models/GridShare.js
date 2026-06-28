const mongoose = require('mongoose');

const gridShareSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gridId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Grid',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GridShare', gridShareSchema);
