import mongoose from 'mongoose';

const productSchema = mongoose.Schema({
  productId: { type: String, required: true }, // Optional: internal SKU
  name: { type: String, required: true },
  brand: String,
  model: String,
  partNumber: { type: String , required: true }, // Unique identifier for the product
  category: { type: String, enum: ['bike', 'scooter', 'ALL'], required: true },
  price: { type: Number, required: true },  
  quantity: { type: Number, required: true },
  description: String,
  images: [String],
}, {
  timestamps: true,
});

const Product = mongoose.model('Product', productSchema, 'products');

export default Product;
