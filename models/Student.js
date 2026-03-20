const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll_number: { type: String, required: true, unique: true }, // Format: JEE26TE
  email: { type: String, required: true, unique: true },
  class_id: { type: String, required: true },
  course: { type: String, required: true },
  parent_email: { type: String },
  parent_phone: { type: String },
  photo_url: { type: String },
  qr_code_data_url: { type: String },
  qr_payload: { type: mongoose.Schema.Types.Mixed },
  fees_paid: { type: Boolean, default: false },
  valid_until: { type: Date },
  registered_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);
