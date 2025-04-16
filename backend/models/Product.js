import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  stock: Number,
  barcode: String
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
