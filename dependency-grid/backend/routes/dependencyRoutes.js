const express = require('express');
const router = express.Router();
const dependencyController = require('../controllers/dependencyController');

router.get('/', dependencyController.getAll);
router.post('/', dependencyController.create);
router.put('/:id', dependencyController.update);
router.delete('/:id', dependencyController.remove);

module.exports = router;
