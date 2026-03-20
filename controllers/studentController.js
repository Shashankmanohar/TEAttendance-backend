const Student = require('../models/Student');

exports.createStudent = async (req, res) => {
  try {
    console.log('Registering student with data:', JSON.stringify(req.body, null, 2));
    
    // Generate QR payload
    const qr_payload = {
      roll_number: req.body.roll_number,
      class_id: req.body.class_id,
      course: req.body.course
    };

    const student = new Student({
      ...req.body,
      qr_payload: qr_payload
    });

    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error('Registration Error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate key error: A student with this roll number or email already exists.',
        error: err.message 
      });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.toggleFeeStatus = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    student.fees_paid = !student.fees_paid;
    await student.save();
    res.json({ message: `Fees status updated to ${student.fees_paid ? 'Paid' : 'Unpaid'}`, student });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
