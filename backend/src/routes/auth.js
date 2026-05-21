const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'user' });
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed an admin account (for testing)
router.get('/seed-admin', async (req, res) => {
  try {
    const exists = await User.findOne({ email: 'admin@library.com' });
    if (exists) return res.json({ message: 'Admin already exists. email: admin@library.com, password: admin123' });
    const hashed = await bcrypt.hash('admin123', 10);
    await User.create({ name: 'Admin', email: 'admin@library.com', password: hashed, role: 'admin' });
    res.json({ message: 'Admin seeded successfully. email: admin@library.com, password: admin123' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
