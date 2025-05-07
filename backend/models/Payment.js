import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const paymentSchema = new mongoose.Schema({
  billingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Billing',
    required: true,
    index: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
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
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['UPI', 'Cash'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema, 'payments');

export default Payment;
