// backend/models/Product.js

import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  brand: String,
  model: String,
  partNo: { type: String, required: false },
  category: { type: String, enum: ['bike', 'scooter','ALL'], required: true },
  price: { type: Number, required: true },  // Required
  quantity: { type: Number, required: true },
  description: String,
  images: [String],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema, 'products');

export default Product;
