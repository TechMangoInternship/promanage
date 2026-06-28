const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');

router.get('/', streamController.getAll);
router.post('/', streamController.create);
router.post('/seed', streamController.seed);
router.put('/:id', streamController.update);
router.delete('/:id', streamController.remove);

module.exports = router;
