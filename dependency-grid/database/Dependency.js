const mongoose = require('mongoose');

const dependencySchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Dependency text is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Dependency', dependencySchema);
