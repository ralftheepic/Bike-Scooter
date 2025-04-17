import React, { useState } from 'react';

const ManualEntryForm = ({ onAddItem }) => {
  const [productId, setProductId] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('bike');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      productId,
      name,
      brand,
      model,
      category,
      price: parseFloat(price),
      quantity: parseInt(quantity, 10),
      description,
      images: imageUrl ? [imageUrl] : [],
    };

    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const addedItem = await response.json();
        console.log('Item added:', addedItem);
        setSuccessMessage('Item added successfully!');
        setErrorMessage('');
        onAddItem(addedItem);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Error adding item:', error);
        setSuccessMessage('');
        setErrorMessage('Failed to add item. Please try again later.');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setSuccessMessage('');
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  const resetForm = () => {
    setProductId('');
    setName('');
    setBrand('');
    setModel('');
    setCategory('bike');
    setPrice('');
    setQuantity('');
    setDescription('');
    setImageUrl('');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-xl font-semibold mb-4">Manual Entry</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-semibold">Product ID</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Name</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Brand</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Model</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Category</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="bike">Bike</option>
            <option value="scooter">Scooter</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Price</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Quantity</label>
          <input
            type="number"
            className="w-full border rounded px-3 py-2"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Image URL</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 font-semibold">Description</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          ></textarea>
        </div>
        <div className="md:col-span-2 text-right">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Add Item
          </button>
        </div>
      </form>
      {successMessage && (
        <div className="mt-4 text-green-600">
          <p>{successMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 text-red-600">
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

const Inventory = () => {
  const [showManualEntry, setShowManualEntry] = useState(true);
  const [showScannerEntry, setShowScannerEntry] = useState(false);
  const [inventory, setInventory] = useState([]);

  const handleAddItem = (item) => {
    console.log('Item added:', item);
    setInventory((prev) => [...prev, item]);
    setShowManualEntry(false); // Optional: Hide form after adding item
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setShowManualEntry(true);
            setShowScannerEntry(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Manual Entry
        </button>
        <button
          onClick={() => {
            setShowScannerEntry(true);
            setShowManualEntry(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Scanner Entry
        </button>
      </div>
      {showManualEntry && <ManualEntryForm onAddItem={handleAddItem} />}
      {showScannerEntry && <div className="bg-white p-4 rounded shadow">Scanner functionality coming soon.</div>}
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Inventory List</h3>
        {inventory.length === 0 ? (
          <p>No items added yet.</p>
        ) : (
          <ul>
            {inventory.map((item, index) => (
              <li key={index} className="border-b py-2">
                {item.name} - {item.price} - {item.category}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Inventory;
