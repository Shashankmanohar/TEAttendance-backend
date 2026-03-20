const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  student_name: { type: String, required: true },
  roll_number: { type: String, required: true },
  class_id: { type: String, required: true },
  course: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  timestamp: { type: Date, default: Date.now },
  face_image_url: { type: String }, // Optional: only if provided
  status: { type: String }, // e.g., "You Can Enter", "Fees Not Paid", "Validity Expired"
  email_sent: { type: Boolean, default: false },
  email_sent_at: { type: Date },
});

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
