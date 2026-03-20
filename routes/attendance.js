const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.post('/clock-in', attendanceController.clockIn); // Could be public or protected depending on use case
router.get('/history', attendanceController.getAttendanceHistory);

module.exports = router;
