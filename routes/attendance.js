const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

router.post('/clock-in', attendanceController.clockIn);
router.get('/history', attendanceController.getAttendanceHistory);
router.get('/latest', attendanceController.getLatestAttendance);
router.get('/check-status/:rollNumber', attendanceController.checkStatusByRollNumber);

module.exports = router;
