const mongoose = require('mongoose');

// Dynamic Schema: We use a mixed type for `data` so we can store arbitrary JSON
const dynamicGridSchema = new mongoose.Schema({
  gridName: {
    type: String,
    required: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
  }
}, {
  timestamps: true,
  // Strict false allows fields not defined in the schema to be saved if needed, 
  // though using Mixed for `data` is usually sufficient.
  strict: false 
});

module.exports = mongoose.model('DynamicGrid', dynamicGridSchema);
