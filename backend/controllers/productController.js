// backend/controllers/productController.js
import Product from '../models/Product.js';
import logger from '../utils/logger.js';

const addProduct = async (req, res) => {
  console.log('Received request body:', req.body); // Log the request body
  const { name, brand, model,partno, category, price, quantity, description, images } = req.body;

  try {
    const existingProduct = await Product.findOne({ name, brand, model,partno });

    if (existingProduct) {
      logger.info('Product already exists:', existingProduct); 
      existingProduct.quantity += Number(quantity); 
      const updatedProduct = await existingProduct.save();
      logger.info('Product quantity updated successfully:', updatedProduct);
      res.status(200).json(updatedProduct); 
    } else {
      const newProduct = new Product({
        name,
        brand,
        model,
        partno,
        category,
        price,
        quantity,
        description,
        images,
      });
      logger.info('New product object:', newProduct); 
      const createdProduct = await newProduct.save();
      logger.info('Product created successfully:', createdProduct);
      res.status(201).json(createdProduct); 
    }
  } catch (error) {
    console.error('Error adding/updating product:', error); 
    res.status(500).json({ message: 'Error adding/updating product', error: error.message });
  }
};

const getAllProducts = async (req, res) => {
  logger.info('Received request to get all products');
  try {
    const products = await Product.find({}); 
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
    const result = await Product.deleteMany({});
    logger.info('Deleted all products. Count:', result.deletedCount);
    res.status(200).json({ message: `${result.deletedCount} products deleted successfully` });
  } catch (error) {
    logger.error('Error deleting all products:', error);
    res.status(500).json({ message: 'Error deleting products', error: error.message });
  }
};

export default { addProduct, getAllProducts, deleteAllProducts };