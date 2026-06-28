const mongoose = require('mongoose');

const shareLinkSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GridRow',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ShareLink', shareLinkSchema);
