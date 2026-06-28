const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');

router.get('/', featureController.getAll);
router.post('/', featureController.create);
router.put('/:id', featureController.update);
router.delete('/:id', featureController.remove);

module.exports = router;
