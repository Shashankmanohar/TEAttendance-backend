const User = require('../models/User');
const StaffAttendance = require('../models/StaffAttendance');

// Clock In
exports.clockIn = async (req, res) => {
  try {
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    let attendance = await StaffAttendance.findOne({ staffId, date: today });
    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already clocked in today' });
    }

    if (!attendance) {
      attendance = new StaffAttendance({
        staffId,
        date: today,
        checkIn: new Date(),
        status: 'Present'
      });
    } else {
      attendance.checkIn = new Date();
    }

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Clock Out
exports.clockOut = async (req, res) => {
  try {
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const attendance = await StaffAttendance.findOne({ staffId, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'Must clock in before clocking out' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already clocked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get Staff Attendance (Self or by Admin)
exports.getStaffAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const query = { staffId: id || req.user.id };
    if (month && year) {
      query.date = { $regex: `^${year}-${month.padStart(2, '0')}` };
    }

    const records = await StaffAttendance.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get Today's Status
exports.getTodayStatus = async (req, res) => {
  try {
    const staffId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const attendance = await StaffAttendance.findOne({ staffId, date: today });
    res.json(attendance || { message: 'Not clocked in yet' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get All Staff (Admin only)
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-password').sort({ createdAt: -1 });
    const queryMonth = req.query.month; // e.g. "2026-02"
    const currentMonthPrefix = queryMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    
    // Enrich with monthly and total presence count
    const enrichedStaff = await Promise.all(staff.map(async (s) => {
      // Monthly count
      const monthlyCount = await StaffAttendance.countDocuments({
        staffId: s._id,
        date: { $regex: `^${currentMonthPrefix}` },
        status: 'Present'
      });

      // Total lifetime count
      const totalCount = await StaffAttendance.countDocuments({
        staffId: s._id,
        status: 'Present'
      });

      return { 
        ...s._doc, 
        monthlyPresenceCount: monthlyCount,
        totalPresenceCount: totalCount
      };
    }));

    res.json(enrichedStaff);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// Update Staff (Admin only)
exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, photo_url, public_id, staff_id } = req.body;
    
    const updateData = { name, email, photo_url, public_id, staff_id };
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'Staff member not found' });
    
    Object.assign(user, updateData);
    if (password) user.password = password; // pre-save will hash

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete Staff (Admin only)
exports.deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'Staff member not found' });
    
    // Also delete attendance records
    await StaffAttendance.deleteMany({ staffId: id });
    
    res.json({ message: 'Staff member and all attendance records deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
