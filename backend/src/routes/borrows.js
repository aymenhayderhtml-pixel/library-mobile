const router = require('express').Router();
const Borrow = require('../models/Borrow');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

function calcFine(dueDate, returnDate, fineRate = 10) {
  const due = new Date(dueDate);
  const ret = new Date(returnDate || Date.now());
  const diffDays = Math.floor((ret - due) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * fineRate : 0;
}

async function updateOverdue() {
  await Borrow.updateMany(
    { status: 'active', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
}

// Get my borrows
router.get('/mine', auth, async (req, res) => {
  try {
    await updateOverdue();
    const borrows = await Borrow.find({ userId: req.user.id })
      .populate('bookId', 'title author')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Borrow a book (Request)
router.post('/', auth, async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.availableCopies < 1) return res.status(400).json({ message: 'No copies available' });
    const existing = await Borrow.findOne({ userId: req.user.id, bookId, status: { $in: ['pending', 'active', 'overdue'] } });
    if (existing) return res.status(400).json({ message: 'You already requested or borrowed this book' });
    
    // Reserve the copy immediately
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
    const borrow = await Borrow.create({ userId: req.user.id, bookId, status: 'pending' });
    res.status(201).json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Approve borrow request
router.patch('/:id/approve', auth, admin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow record not found' });
    if (borrow.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be approved' });
    
    const { durationDays = 14, fineRate = 10 } = req.body;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(durationDays));
    
    borrow.status = 'active';
    borrow.borrowDate = new Date();
    borrow.dueDate = dueDate;
    borrow.fineRate = Number(fineRate);
    await borrow.save();
    
    res.json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Reject borrow request
router.patch('/:id/reject', auth, admin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow record not found' });
    if (borrow.status !== 'pending') return res.status(400).json({ message: 'Only pending requests can be rejected' });
    
    borrow.status = 'rejected';
    await borrow.save();
    
    // Release the reserved copy
    await Book.findByIdAndUpdate(borrow.bookId, { $inc: { availableCopies: 1 } });
    
    res.json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Return a book
router.patch('/:id/return', auth, admin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow not found' });
    if (borrow.status === 'returned') return res.status(400).json({ message: 'Already returned' });
    const fine = calcFine(borrow.dueDate, new Date(), borrow.fineRate || 10);
    borrow.returnDate = new Date();
    borrow.fine = fine;
    borrow.fineStatus = fine > 0 ? 'unpaid' : 'none';
    borrow.status = 'returned';
    await borrow.save();
    await Book.findByIdAndUpdate(borrow.bookId, { $inc: { availableCopies: 1 } });
    res.json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Mark fine as paid
router.patch('/:id/fine/pay', auth, admin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow not found' });
    if (borrow.fineStatus !== 'unpaid') return res.status(400).json({ message: 'Fine is not in unpaid state' });
    borrow.fineStatus = 'paid';
    await borrow.save();
    res.json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Waive fine
router.patch('/:id/fine/waive', auth, admin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow not found' });
    if (borrow.fineStatus !== 'unpaid') return res.status(400).json({ message: 'Fine is not in unpaid state' });
    borrow.fineStatus = 'waived';
    await borrow.save();
    res.json(borrow);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: get all borrows
router.get('/all', auth, admin, async (req, res) => {
  try {
    await updateOverdue();
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    const borrows = await Borrow.find(query)
      .populate('userId', 'name email')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 });
    res.json(borrows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
