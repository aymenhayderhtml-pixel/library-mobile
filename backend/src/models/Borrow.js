const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  borrowDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  returnDate: { type: Date, default: null },
  fine: { type: Number, default: 0 },
  fineRate: { type: Number, default: 10 },
  fineStatus: { type: String, enum: ['none', 'unpaid', 'paid', 'waived'], default: 'none' },
  status: { type: String, enum: ['pending', 'active', 'returned', 'overdue', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Borrow', borrowSchema);
