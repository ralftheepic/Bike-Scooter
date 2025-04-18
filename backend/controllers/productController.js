// backend/controllers/productController.js
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const addProduct = async (req, res) => {
  console.log('Received request body:', req.body); // Log the request body
  const { name, brand, model, category, price, quantity, description, images } = req.body;

  try {
    // Check if a product with the same name, brand, and model already exists
    const existingProduct = await Product.findOne({ name, brand, model });

    if (existingProduct) {
      // If the product exists, increase its quantity
      existingProduct.quantity += Number(quantity); // Ensure quantity is treated as a number
      const updatedProduct = await existingProduct.save();
      console.log('Product quantity updated successfully:', updatedProduct);
      res.status(200).json(updatedProduct); // Respond with the updated product
    } else {
      // If the product doesn't exist, create a new one
      const newProduct = new Product({
        name,
        brand,
        model,
        category,
        price,
        quantity,
        description,
        images,
      });
      console.log('New product object:', newProduct); // Log the new product object
      const createdProduct = await newProduct.save();
      console.log('Product created successfully:', createdProduct);
      res.status(201).json(createdProduct); // Respond with the newly created product
    }
  } catch (error) {
    console.error('Error adding/updating product:', error); // Log the error
    res.status(500).json({ message: 'Error adding/updating product', error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  logger.info('Received request to get all products');
  try {
    const products = await Product.find({}); // Empty object {} means find all documents
    logger.info('Retrieved all products:', products.length);
    res.status(200).json(products);
  } catch (error) {
    logger.error('Error fetching all products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

const deleteAllProducts = async (req, res) => {
  logger.warn('Received request to delete all products - USE WITH CAUTION!');
  try {
    const result = await Product.deleteMany({}); // Empty object {} means delete all documents
    logger.info('Deleted all products. Count:', result.deletedCount);
    res.status(200).json({ message: `${result.deletedCount} products deleted successfully` });
  } catch (error) {
    logger.error('Error deleting all products:', error);
    res.status(500).json({ message: 'Error deleting products', error: error.message });
  }
};

export default { addProduct, getAllProducts, deleteAllProducts };