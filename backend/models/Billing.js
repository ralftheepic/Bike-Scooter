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
    customerPhoneNumber: { 
      type: String,
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
      default: true, // By default, create draft bills
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
