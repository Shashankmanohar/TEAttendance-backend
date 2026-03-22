const Student = require('../models/Student');
const AttendanceRecord = require('../models/AttendanceRecord');

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
    let query = {};
    if (req.user && req.user.role === 'student') {
      query.email = req.user.email;
    }
    
    const now = new Date();
    const queryMonth = req.query.month; // e.g. "2026-02"
    const currentMonthPrefix = queryMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const students = await Student.find(query).sort({ registered_at: -1 });

    // Enrich with monthly and total presence count
    const enrichedStudents = await Promise.all(students.map(async (s) => {
      // Monthly count
      const monthlyCount = await AttendanceRecord.countDocuments({
        student_id: s._id,
        date: { $regex: `^${currentMonthPrefix}` },
        status: "You Can Enter"
      });

      // Total lifetime count
      const totalCount = await AttendanceRecord.countDocuments({
        student_id: s._id,
        status: "You Can Enter"
      });

      return { 
        ...s._doc, 
        monthlyPresenceCount: monthlyCount,
        totalPresenceCount: totalCount
      };
    }));

    res.json(enrichedStudents);
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
    
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id, 
      { $set: { fees_paid: !student.fees_paid } }, 
      { new: true, runValidators: false } // Skip validators to avoid issues with missing fields in legacy records
    );
    
    res.json({ 
      message: `Fees status updated to ${updatedStudent.fees_paid ? 'Paid' : 'Unpaid'}`, 
      student: updatedStudent 
    });
  } catch (err) {
    console.error('Toggle Fees Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    console.log(`Fetching attendance for student ${id}, month: ${month}, year: ${year}`);

    const query = { student_id: id };
    if (month && year) {
      // Handle both "2026-03" and more flexible matches
      const monthStr = month.padStart(2, '0');
      query.date = { $regex: `${year}-${monthStr}` };
    }

    const records = await AttendanceRecord.find(query).sort({ date: -1, timestamp: -1 });
    console.log(`Found ${records.length} records for student ${id}`);
    res.json(records);
  } catch (err) {
    console.error('getStudentAttendance error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
