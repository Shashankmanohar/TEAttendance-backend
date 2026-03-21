const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

router.post('/', auth, studentController.createStudent);
router.get('/', auth, studentController.getStudents);
router.put('/:id', auth, studentController.updateStudent);
router.patch('/:id/toggle-fees', auth, studentController.toggleFeeStatus);
router.delete('/:id', auth, studentController.deleteStudent);

module.exports = router;
