import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  nameDescription: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
});

const billingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerPhoneNumber: { // Added customer phone number field
      type: String,
      required: false, // Adjust to true if phone number is always required
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Billing = mongoose.model('Billing', billingSchema, 'billing');

export default Billing;