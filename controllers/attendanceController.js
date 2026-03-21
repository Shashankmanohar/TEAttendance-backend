const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');

exports.clockIn = async (req, res) => {
  try {
    console.log('Attendance mark request:', JSON.stringify(req.body, null, 2));
    const { roll_number, class_id, course, face_image_url } = req.body;
    const student = await Student.findOne({ roll_number });
    if (!student) {
      console.log('Student not found for roll_number:', roll_number);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if duplicate for today
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking attendance for student ${student.name} on ${today}`);
    
    const existing = await AttendanceRecord.findOne({ student_id: student._id, date: today });
    if (existing) {
      console.log('Duplicate attendance detected for today');
      return res.status(400).json({ 
        message: 'Attendance Already Marked for Today',
        alreadyMarked: true,
        student: {
          name: student.name,
          roll_number: student.roll_number,
          photo_url: student.photo_url
        }
      });
    }
    console.log('No existing record found, proceeding...');

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

exports.checkStatusByRollNumber = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const student = await Student.findOne({ roll_number: rollNumber });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const today = new Date().toISOString().split('T')[0];
    const record = await AttendanceRecord.findOne({ student_id: student._id, date: today });

    res.json({
      isMarked: !!record,
      message: record ? 'Attendance Marked' : 'Attendance Not Marked Yet',
      timestamp: record ? record.timestamp : null,
      student: {
        name: student.name,
        roll_number: student.roll_number,
        photo_url: student.photo_url,
        course: student.course,
        class_id: student.class_id
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getLatestAttendance = async (req, res) => {
  try {
    const latest = await AttendanceRecord.findOne().sort({ timestamp: -1 });
    if (!latest) return res.status(200).json(null);

    const student = await Student.findById(latest.student_id);

    res.json({
      ...latest._doc,
      student_photo: student ? student.photo_url : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
