const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

router.post('/', studentController.createStudent);
router.get('/', studentController.getStudents);
router.put('/:id', studentController.updateStudent);
router.patch('/:id/toggle-fees', studentController.toggleFeeStatus);

module.exports = router;
