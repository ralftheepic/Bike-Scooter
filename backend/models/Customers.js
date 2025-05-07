import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
    trim: true
  },
  latestBillingDate: {
    type: Date,
    required: false
  },
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema, 'customers');

export default Customer;
