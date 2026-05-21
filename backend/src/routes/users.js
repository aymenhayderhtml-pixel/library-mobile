const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Get my stats
router.get('/me/stats', auth, async (req, res) => {
  try {
    const borrows = await Borrow.find({ userId: req.user.id });
    const active = borrows.filter(b => ['active', 'return_requested'].includes(b.status)).length;
    const overdue = borrows.filter(b => b.status === 'overdue').length;
    const totalFine = borrows.reduce((sum, b) => sum + b.fine, 0);
    res.json({ active, overdue, totalFine });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Incorrect current password' });
    
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all users
router.get('/', auth, admin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: add user
router.post('/', auth, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    res.status(201).json({ _id: user._id, id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: update user
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (email) {
      const exists = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (exists) return res.status(400).json({ message: 'Email already exists' });
    }
    const update = { name, email };
    if (password) update.password = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: delete user
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: stats
router.get('/admin/stats', auth, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalBooks = await Book.countDocuments();
    const borrowedBooks = await Borrow.countDocuments({ status: { $in: ['active', 'overdue'] } });
    const overdueBooks = await Borrow.countDocuments({ status: 'overdue' });
    const finesData = await Borrow.aggregate([{ $group: { _id: null, total: { $sum: '$fine' } } }]);
    const collectedFines = finesData[0]?.total || 0;
    res.json({ totalUsers, totalBooks, borrowedBooks, overdueBooks, collectedFines });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
