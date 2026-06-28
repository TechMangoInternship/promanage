const mongoose = require("mongoose");

const ResourceSchema = new mongoose.Schema(
  {
    resourceName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    rate: {
      type: String,
      default: "",
    },
    // Columns 1–12 stored as a plain object: { "1": "val", "2": "val", ... }
    columns: {
      type: Object,
      default: {},
    },
    projectName: {
      type: String,
      default: '',
    },
    version: {
      type: String,
      default: '',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resource", ResourceSchema);