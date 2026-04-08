const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  items: [
    {
      name: String,
      description: String,
      price: String,
      quantity: Number,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  deliveryFee: {
    type: Number,
    default: 10,
  },
  notes: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Preparing', 'On Way', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
