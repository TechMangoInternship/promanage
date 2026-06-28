const express = require('express');
const router = express.Router();
const assumptionController = require('../controllers/assumptionController');

router.get('/', assumptionController.getAll);
router.post('/', assumptionController.create);
router.put('/:id', assumptionController.update);
router.delete('/:id', assumptionController.remove);

module.exports = router;
