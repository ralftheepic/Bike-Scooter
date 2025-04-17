// backend/models/Product.js

import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  productId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: String,
  model: String,
  category: { type: String, enum: ['bike', 'scooter'], required: true },
  price: { type: Number, required: true },  // Required
  quantity: { type: Number, required: true },
  description: String,
  images: [String],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema, 'inventory');

export default Product;
