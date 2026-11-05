
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true
},
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  type: {
    type: String,
    required: true,
    enum: ['Income', 'Expense']
  },
  category: {
    type: String,
    required: true
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-IN')
  },
    isDeleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
