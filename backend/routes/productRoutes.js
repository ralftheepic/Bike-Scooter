import express from 'express';
const router = express.Router();

// Example inventory (you’ll replace this with a real DB later)
let inventory = [
  { id: '123', name: 'Scooter A', description: 'Electric scooter', price: 1000, quantity: 5 },
  { id: '456', name: 'Helmet', description: 'Protective helmet', price: 150, quantity: 10 },
];

router.get('/', (req, res) => {
  res.json(inventory);
});

router.post('/scan', (req, res) => {
  const { barcode, action } = req.body;
  const product = inventory.find(p => p.id === barcode);

  if (!product) return res.status(404).json({ message: 'Product not found' });

  if (action === 'sell') product.quantity -= 1;
  else if (action === 'restock') product.quantity += 1;

  res.json(product);
});

export default router;
