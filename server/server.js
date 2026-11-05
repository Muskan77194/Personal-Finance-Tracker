
const express = require('express');
const cors = require('cors');

const jwt = require('jsonwebtoken');
const authmiddleware = require('./authmiddleware');

const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('./Transaction');
const bcrypt = require('bcryptjs');
const User = require('./User');


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });


let transactions = [];
let nextId = 1;

app.get('/', (req, res) => {
  res.send('Personal Finance Tracker Backend is running!');
});

// Register a new user

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'This email is already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: 'Account created successfully!',
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    res.status(500).json({
      message: 'Could not create account.',
    });
  }
});

// Login an existing user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    res.status(500).json({
      message: 'Could not log in.',
    });
  }
});

// Get all transactions

app.get('/api/transactions', authmiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.userId,
      isDeleted: false,
    }).sort({ _id: -1 });

    console.log('MONGODB GET ROUTE HIT');
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions.' });
  }
});
app.get('/api/transactions/trash', authmiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.userId,
      isDeleted: true,
    }).sort({ _id: -1 });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching trash:', error);
    res.status(500).json({ message: 'Failed to fetch trash.' });
  }
});
app.patch('/api/transactions/:id/restore', authmiddleware, async (req, res) => {
  try {
   const transaction = await Transaction.findOneAndUpdate(
  {
    _id: req.params.id,
    userId: req.user.userId,
    isDeleted: true,
  },
  { isDeleted: false },
  { returnDocument: 'after' }
);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction restored successfully.', transaction });
  } catch (error) {
    console.error('Error restoring transaction:', error);
    res.status(500).json({ message: 'Failed to restore transaction.' });
  }
});

// Add a transaction
 
app.post('/api/transactions', authmiddleware, async (req, res) => {
  try {
   const { title, amount, type, category, date } = req.body;
const userId = req.user.userId;

    if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid title and amount are required.' });
    }

   const transaction = new Transaction({
  userId,
  title,
  amount: Number(amount),
  type,
  category,
  date: date || new Date().toLocaleDateString('en-IN'),
});

    const savedTransaction = await transaction.save();

    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error('Error saving transaction:', error);
    res.status(500).json({ message: 'Failed to save transaction.' });
  }
});

app.put('/api/transactions/:id', authmiddleware, async (req, res) => {
  try {
    const { title, amount, type, category } = req.body;

    if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Valid title and amount are required.' });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        title,
        amount: Number(amount),
        type,
        category
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error.message);
    res.status(500).json({ message: 'Failed to update transaction.' });
  }
});

// Delete a transaction

app.delete('/api/transactions/:id', authmiddleware, async (req, res) => {
  try {
  const transaction = await Transaction.findOneAndUpdate(
  {
    _id: req.params.id,
    userId: req.user.userId,
    isDeleted: false,
  },
  {
    title,
    amount: Number(amount),
    type,
    category,
  },
  { returnDocument: 'after', runValidators: true }
);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (error) {
    console.error('Error deleting transaction:', error.message);
    res.status(500).json({ message: 'Failed to delete transaction.' });
  }
});
console.log('MONGODB VERSION OF SERVER IS RUNNING');
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
