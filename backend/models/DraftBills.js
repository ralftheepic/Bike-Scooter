import mongoose from 'mongoose';

const draftBillSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhoneNumber: { type: String },
  billingDate: { type: Date, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product',required: false },
    nameDescription: String,
    quantity: Number,
    price: Number,
    partNumber: String,
  }],
  totalAmount: { type: Number, required: true },
  isDraft: { type: Boolean, default: true },
});

const DraftBill = mongoose.model('DraftBill', draftBillSchema, 'draftbill');

export default DraftBill;
