const AttendanceRecord = require('../models/AttendanceRecord');
const Student = require('../models/Student');
const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');

exports.clockIn = async (req, res) => {
  try {
    console.log('--- Clock-in Request Start ---');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    const { roll_number, staff_id, class_id, course, face_image_url } = req.body;
    const today = new Date().toISOString().split('T')[0];

    if (!roll_number && !staff_id) {
      console.error('Invalid request: Missing roll_number and staff_id');
      return res.status(400).json({ message: 'Missing roll_number or staff_id' });
    }
    
    // 1. Staff Logic
    if (staff_id || (roll_number && roll_number.startsWith('STF-'))) {
      const searchId = staff_id || roll_number;
      const staffMember = await User.findOne({ staff_id: searchId, role: 'staff' });
      
      if (staffMember) {
        const existingAttendance = await StaffAttendance.findOne({ staffId: staffMember._id, date: today });
        
        if (existingAttendance) {
          return res.status(200).json({
            message: 'Attendance Already Completed for Today',
            alreadyMarked: true,
            student: { 
              name: staffMember.name,
              roll_number: staffMember.staff_id,
              photo_url: staffMember.photo_url
            }
          });
        }

        const newAttendance = new StaffAttendance({
          staffId: staffMember._id,
          date: today,
          checkIn: new Date(),
          status: 'Present'
        });

        await newAttendance.save();
        return res.status(201).json({
          message: 'Welcome! Attendance Marked',
          canEnter: true,
          student: {
            name: staffMember.name,
            roll_number: staffMember.staff_id,
            photo_url: staffMember.photo_url
          },
          record: { ...newAttendance._doc, student_name: staffMember.name, type: 'staff' }
        });
      }
    }

    // 2. Student & Attendance Logic (Parallelized for Speed)
    const [student, existingRecord] = await Promise.all([
      Student.findOne({ roll_number }).lean(),
      AttendanceRecord.findOne({ roll_number, date: today }).lean()
    ]);

    if (!student) {
      console.log('Student not found for roll_number:', roll_number);
      return res.status(404).json({ message: 'Student not found' });
    }
    
    if (existingRecord) {
      return res.status(200).json({
        message: 'Attendance Already Completed for Today',
        alreadyMarked: true,
        student: {
          name: student.name,
          roll_number: student.roll_number,
          photo_url: student.photo_url
        }
      });
    }

    // New Scan
    let isFeesPaid = student.fees_paid;
    let isValid = student.valid_until ? new Date(student.valid_until) > new Date() : true;
    let dbStatus = "Access Denied";
    let canEnter = false;

    if (isFeesPaid && isValid) {
      dbStatus = "You Can Enter";
      canEnter = true;
    } else if (!isFeesPaid) {
      dbStatus = "Fees Not Paid";
    } else if (!isValid) {
      dbStatus = "Validity Expired";
    }

    const newRecord = new AttendanceRecord({
      student_id: student._id,
      student_name: student.name,
      roll_number: student.roll_number,
      class_id: class_id || student.class_id || 'default',
      course: course || student.course || '',
      date: today,
      checkIn: new Date(),
      face_image_url,
      status: dbStatus
    });

    await newRecord.save();

    res.status(201).json({ 
      message: (isFeesPaid && isValid) ? "Welcome! You Can Enter" : "Welcome! Attendance Marked", 
      canEnter: canEnter,
      student: {
        name: student.name,
        roll_number: student.roll_number,
        photo_url: student.photo_url,
        valid_until: student.valid_until
      },
      record: newRecord 
    });
  } catch (err) {
    console.error('Clock-in error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getAttendanceHistory = async (req, res) => {
  try {
    let query = {};
    
    // If user is a student, only show their records
    if (req.user && req.user.role === 'student') {
      const student = await Student.findOne({ email: req.user.email });
      if (student) {
        query.student_id = student._id;
      } else {
        // If student not found by email, return empty array
        return res.json([]);
      }
    }
    
    const history = await AttendanceRecord.find(query).sort({ timestamp: -1 });
    
    // If student, calculate monthly count
    let monthlyCount = 0;
    if (req.user && req.user.role === 'student') {
       const now = new Date();
       const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
       monthlyCount = await AttendanceRecord.countDocuments({
         ...query,
         date: { $regex: `^${currentMonthPrefix}` },
         status: "You Can Enter"
       });
    }

    res.json({
      history,
      monthlyPresenceCount: monthlyCount
    });
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
