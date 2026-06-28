const DynamicGrid = require('../models/DynamicGrid');

// Get all rows for a specific grid
exports.getRows = async (req, res) => {
  try {
    const { gridName } = req.params;
    const rows = await DynamicGrid.find({ gridName }).sort({ createdAt: 1 });
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching grid rows:', error);
    res.status(500).json({ message: 'Server error fetching grid rows' });
  }
};

// Add a new row to a specific grid
exports.addRow = async (req, res) => {
  try {
    const { gridName } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Row data is required' });
    }

    const newRow = new DynamicGrid({
      gridName,
      data
    });

    const savedRow = await newRow.save();
    res.status(201).json(savedRow);
  } catch (error) {
    console.error('Error adding grid row:', error);
    res.status(500).json({ message: 'Server error adding grid row' });
  }
};

// Update an existing row
exports.updateRow = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ message: 'Row data is required' });
    }

    // Use findByIdAndUpdate to replace the `data` field
    const updatedRow = await DynamicGrid.findByIdAndUpdate(
      id,
      { data },
      { new: true, runValidators: true }
    );

    if (!updatedRow) {
      return res.status(404).json({ message: 'Row not found' });
    }

    res.status(200).json(updatedRow);
  } catch (error) {
    console.error('Error updating grid row:', error);
    res.status(500).json({ message: 'Server error updating grid row' });
  }
};

// Delete a row
exports.deleteRow = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedRow = await DynamicGrid.findByIdAndDelete(id);
    
    if (!deletedRow) {
      return res.status(404).json({ message: 'Row not found' });
    }

    res.status(200).json({ message: 'Row deleted successfully', id });
  } catch (error) {
    console.error('Error deleting grid row:', error);
    res.status(500).json({ message: 'Server error deleting grid row' });
  }
};
