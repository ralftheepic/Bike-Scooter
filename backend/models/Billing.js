import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const billingItemSchema = new mongoose.Schema({
  product: {
    type: ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true, // Store the price at the time of billing
  },
});

const billingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
  },
  customerPhoneNumber: {
    type: String,
    required: true,
  },
  billingDate: {
    type: Date,
    required: true,
  },
  items: [billingItemSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  isDraft: {
    type: Boolean,
    default: true,
  },
  customerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false,
  },
  paymentRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: false,
  },
  finalizedAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Billing = mongoose.model('Billing', billingSchema, 'billing');

export default Billing;
