const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');

exports.clockIn = async (req, res) => {
  try {
    console.log('Attendance mark request:', JSON.stringify(req.body, null, 2));
    const { roll_number, class_id, course, face_image_url } = req.body;
    const student = await Student.findOne({ roll_number });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Check fee status and validity
    const isFeesPaid = student.fees_paid;
    const isValid = student.valid_until ? new Date(student.valid_until) > new Date() : true;
    
    let statusMessage = "Access Denied";
    let canEnter = false;

    if (isFeesPaid && isValid) {
      statusMessage = "You Can Enter";
      canEnter = true;
    } else if (!isFeesPaid) {
      statusMessage = "Fees Not Paid";
    } else if (!isValid) {
      statusMessage = "Validity Expired";
    }

    const record = new AttendanceRecord({
      student_id: student._id,
      student_name: student.name,
      roll_number: student.roll_number,
      class_id,
      course,
      date: new Date().toISOString().split('T')[0],
      face_image_url,
      status: statusMessage // Adding status to the record
    });

    await record.save();
    res.status(201).json({ 
      message: statusMessage, 
      canEnter, 
      student: {
        name: student.name,
        roll_number: student.roll_number,
        photo_url: student.photo_url,
        valid_until: student.valid_until
      },
      record 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    const history = await AttendanceRecord.find().sort({ timestamp: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
