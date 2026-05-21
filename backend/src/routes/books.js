const router = require('express').Router();
const Book = require('../models/Book');
const Borrow = require('../models/Borrow');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Fix indexes (drops all indexes to resolve duplicate key errors)
router.get('/fix-indexes', async (req, res) => {
  try {
    await Book.collection.dropIndexes();
    res.json({ message: 'All book indexes dropped successfully. You can now run seed-all.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed books (for testing)
router.get('/seed-all', async (req, res) => {
  try {
    await Book.deleteMany({}); // Optional: clears existing books first
    const books = await Book.insertMany([
      { title: 'Clean Code', author: 'Robert C. Martin', category: 'Technology', description: 'A handbook of agile software craftsmanship.', publishDate: '2008-08-01', quantity: 3, availableCopies: 3 },
      { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', category: 'Fiction', description: 'A story of the Jazz Age.', publishDate: '1925-04-10', quantity: 2, availableCopies: 2 },
      { title: 'A Brief History of Time', author: 'Stephen Hawking', category: 'Science', description: 'Exploring the nature of space and time.', publishDate: '1988-04-01', quantity: 1, availableCopies: 1 },
      { title: 'To Kill a Mockingbird', author: 'Harper Lee', category: 'Fiction', description: 'A novel about racial injustice.', publishDate: '1960-07-11', quantity: 2, availableCopies: 2 },
      { title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Technology', description: 'Practical advice for programmers.', publishDate: '1999-10-20', quantity: 1, availableCopies: 1 },
      { title: 'Sapiens', author: 'Yuval Noah Harari', category: 'Science', description: 'A brief history of humankind.', publishDate: '2011-01-01', quantity: 2, availableCopies: 2 },
      { title: '1984', author: 'George Orwell', category: 'Fiction', description: 'A dystopian novel about totalitarianism.', publishDate: '1949-06-08', quantity: 3, availableCopies: 3 },
      { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', category: 'Technology', description: 'The comprehensive textbook on algorithms.', publishDate: '1990-01-01', quantity: 2, availableCopies: 2 },
    ]);
    res.json({ message: 'Books seeded successfully', count: books.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all books (public)
router.get('/', async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = {};
    if (search) query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ];
    if (category) query.category = category;
    const sortObj = sort === 'author' ? { author: 1 } : { title: 1 };
    const books = await Book.find(query).sort(sortObj);
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add book (admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const { title, author, category, description, publishDate, quantity } = req.body;
    const book = await Book.create({
      title, author, category, description, publishDate,
      quantity, availableCopies: quantity,
    });
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update book (admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    if (req.body.quantity !== undefined) {
      const diff = req.body.quantity - book.quantity;
      req.body.availableCopies = book.availableCopies + diff;
      if (req.body.availableCopies < 0) {
        return res.status(400).json({ message: 'Cannot reduce quantity below currently borrowed copies' });
      }
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete book (admin only)
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    const activeBorrows = await Borrow.findOne({ bookId: req.params.id, status: { $in: ['active', 'overdue'] } });
    if (activeBorrows) {
      return res.status(400).json({ message: 'Cannot delete book: there are active or overdue borrows' });
    }
    
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
