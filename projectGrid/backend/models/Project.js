const mongoose = require("mongoose");

const VersionSchema = new mongoose.Schema(
  {
    versionName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true, timestamps: true }
);

const ProjectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    columns: {
      type: Object,
      default: {},
    },
    versions: {
      type: [VersionSchema],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", ProjectSchema);