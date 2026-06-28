const mongoose = require('mongoose');

const assumptionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Assumption text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Assumption', assumptionSchema);
