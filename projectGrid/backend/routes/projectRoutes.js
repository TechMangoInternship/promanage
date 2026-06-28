const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// GET all projects (ordered)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1, createdAt: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – add new project at end
router.post("/", async (req, res) => {
  try {
    const { projectName, columns } = req.body;
    const count = await Project.countDocuments();
    const project = new Project({
      projectName: projectName || "",
      columns: columns || {},
      order: count,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST – insert row at specific index
router.post("/insert", async (req, res) => {
  try {
    const { afterIndex, projectName, columns } = req.body;
    const insertOrder = afterIndex + 1;
    await Project.updateMany(
      { order: { $gte: insertOrder } },
      { $inc: { order: 1 } }
    );
    const project = new Project({
      projectName: projectName || "",
      columns: columns || {},
      order: insertOrder,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT – update a project
router.put("/:id", async (req, res) => {
  try {
    const { projectName, columns } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName, columns },
      { new: true, runValidators: false }
    );
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH – update single cell
router.patch("/:id/cell", async (req, res) => {
  try {
    const { col, value } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });

    if (col === "projectName") {
      project.projectName = value;
    } else {
      project.columns[col] = value;
      project.markModified("columns");
    }
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE all – must be before /:id
router.delete("/all", async (req, res) => {
  try {
    await Project.deleteMany({});
    res.json({ message: "All projects deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE single project
router.delete("/:id", async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Version management ──────────────────────────────────────────

// POST /:id/versions – add a version to a project
router.post("/:id/versions", async (req, res) => {
  try {
    const { versionName } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });

    project.versions.push({ versionName: versionName || "" });
    project.markModified("versions");
    await project.save();

    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /:id/versions/:versionId – remove a version from a project
router.delete("/:id/versions/:versionId", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });

    project.versions = project.versions.filter(
      (v) => v._id.toString() !== req.params.versionId
    );
    project.markModified("versions");
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /:id/versions/:versionId – update a version name
router.put("/:id/versions/:versionId", async (req, res) => {
  try {
    const { versionName } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });

    const version = project.versions.id(req.params.versionId);
    if (!version) return res.status(404).json({ error: "Version not found" });

    version.versionName = versionName;
    project.markModified("versions");
    await project.save();

    res.json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;