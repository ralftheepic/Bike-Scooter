import mongoose from 'mongoose';

const draftBillSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhoneNumber: { type: String },
  billingDate: { type: String, required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    nameDescription: String,
    price: Number,
    quantity: Number,
    partNumber: String,
  }],
  totalAmount: { type: Number, required: true },
  isDraft: { type: Boolean, default: true },
});

const DraftBill = mongoose.model('DraftBill', draftBillSchema, 'draftbill');

export default DraftBill;
