const express = require('express');
const router = express.Router();
const gridController = require('../controllers/gridController');

// Routes for a specific grid by name
router.get('/:gridName/rows', gridController.getRows);
router.post('/:gridName/rows', gridController.addRow);

// Routes for specific rows by ID
router.put('/rows/:id', gridController.updateRow);
router.delete('/rows/:id', gridController.deleteRow);

module.exports = router;
