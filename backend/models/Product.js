// backend/models/Product.js
import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true // Assuming each product should have a unique ID
  },
  name: {
    type: String,
    required: true,
  },
  brand: String,
  model: String,
  category: {
    type: String,
    enum: ['bike', 'scooter'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  description: String,
  images: [String],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema, 'inventory'); // Explicitly set collection name to 'inventory'

export default Product;