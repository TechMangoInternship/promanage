const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");

// GET all resources (ordered), optionally filtered by projectName/version
// When no version params provided, only show unscoped resources (direct navigation)
router.get("/", async (req, res) => {
  try {
    const { projectName, version } = req.query;
    let filter = {};
    if (projectName && version) {
      // Version-scoped: show only this version's resources
      filter = { projectName, version };
    } else {
      // No version context: show only unscoped resources
      filter = { projectName: '', version: '' };
    }
    const resources = await Resource.find(filter).sort({ order: 1, createdAt: 1 });
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single resource
router.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Not found" });
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST – add a new resource (append to end)
router.post("/", async (req, res) => {
  try {
    const { resourceName, columns, projectName, version } = req.body;
    const filter = {};
    if (projectName) filter.projectName = projectName;
    if (version) filter.version = version;
    const count = await Resource.countDocuments(filter);
    const resource = new Resource({
      resourceName: resourceName || "",
      columns: columns || {},
      projectName: projectName || "",
      version: version || "",
      order: count,
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST – insert a row at a specific index
router.post("/insert", async (req, res) => {
  try {
    const { afterIndex, resourceName, columns, projectName, version } = req.body;

    const filter = {};
    if (projectName) filter.projectName = projectName;
    if (version) filter.version = version;

    const insertOrder = afterIndex + 1;
    await Resource.updateMany(
      { ...filter, order: { $gte: insertOrder } },
      { $inc: { order: 1 } }
    );

    const resource = new Resource({
      resourceName: resourceName || "",
      columns: columns || {},
      projectName: projectName || "",
      version: version || "",
      order: insertOrder,
    });
    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT – update a resource
router.put("/:id", async (req, res) => {
  try {
    const { resourceName, columns } = req.body;
    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { resourceName, columns },
      { new: true, runValidators: false }  // ← FIXED: runValidators:false avoids required check on update
    );
    if (!resource) return res.status(404).json({ error: "Not found" });
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH – update a single cell
router.patch("/:id/cell", async (req, res) => {
  try {
    const { col, value } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: "Not found" });

    if (col === "resourceName") {
      resource.resourceName = value;
    } else if (col === "rate") {
      resource.rate = value;
    } else {
      resource.columns[col] = value;
      resource.markModified("columns");
    }
    await resource.save();
    res.json(resource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ← FIXED: DELETE all moved ABOVE DELETE /:id to prevent route conflict
// DELETE – delete all
router.delete("/all", async (req, res) => {
  try {
    await Resource.deleteMany({});
    res.json({ message: "All resources deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE – delete a single resource
router.delete("/:id", async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;