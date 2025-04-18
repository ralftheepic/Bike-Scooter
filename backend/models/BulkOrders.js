import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const bulkOrderSchema = new mongoose.Schema({
  distributorSource: { type: String, required: true },
  receiptDate: { type: Date, default: Date.now },
  totalBillAmount: { type: Number, required: true, min: 0 },
  items: [{
    product: { type: ObjectId, ref: 'Product', required: true },
    productId: String,
    name: String,
    brand: String,
    model: String,
    category: String,
    quantityReceived: { type: Number, required: true, min: 1 },
    purchasePrice: { type: Number, required: true, min: 0 },
  }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('BulkOrder', bulkOrderSchema, 'bulkorders');
