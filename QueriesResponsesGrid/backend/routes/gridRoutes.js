const express = require('express');
const router = express.Router();
const {
  getAllGrids,
  getGrid,
  getRows,
  createRow,
  updateRow,
  deleteRow,
  seedGrid,
} = require('../controllers/gridController');

// Grid metadata
router.get('/', getAllGrids);
router.get('/:gridId', getGrid);

// Seed default grid
router.post('/seed', seedGrid);

// Row CRUD
router.get('/:gridId/rows', getRows);
router.post('/:gridId/rows', createRow);
router.put('/rows/:rowId', updateRow);
router.delete('/rows/:rowId', deleteRow);

module.exports = router;
