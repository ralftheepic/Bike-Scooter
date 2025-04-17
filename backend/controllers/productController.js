// backend/controllers/productController.js
import Product from '../models/Product.js';

const addProduct = async (req, res) => {
  console.log('Received request body:', req.body); // Log the request body
  const { productId, name, brand, model, category, price, quantity, description, images } = req.body;

  try {
    const newProduct = new Product({
      productId,
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
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error adding product:', error); // Log the error
    res.status(500).json({ message: 'Error adding product', error: error.message });
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