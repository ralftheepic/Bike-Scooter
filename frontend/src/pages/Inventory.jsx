import React, { useState, useEffect } from 'react';
import ManualEntryForm from '../components/ManualEntryForm';
import BarcodeScanner from '../components/BarcodeScanner';


const Inventory = () => {
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showScannerEntry, setShowScannerEntry] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [showInventoryList, setShowInventoryList] = useState(false);
  const [deleteAllSuccess, setDeleteAllSuccess] = useState('');
  const [deleteAllError, setDeleteAllError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAllProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) {
        const message = `An error occurred: ${response.status}`;
        throw new Error(message);
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductByBarcode = async (barcode) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/barcode/${barcode}`);
      if (!response.ok) {
        throw new Error('Product not found.');
      }
      const product = await response.json();
  
      // Check if product already exists in state
      const alreadyExists = inventory.some(item => item._id === product._id);
      if (!alreadyExists) {
        setInventory((prev) => [...prev, product]);
      }
  
      alert(`Product added: ${product.name}`);
      setShowInventoryList(true);
    } catch (error) {
      console.error(error);
      alert('Failed to fetch product by barcode.');
    }
  };
  

  useEffect(() => {
    if (showInventoryList) {
      fetchAllProducts();
    }
  }, [showInventoryList]);

  const handleAddItem = (item) => {
    console.log('Item added:', item);
    setInventory((prev) => [...prev, item]);
    setShowManualEntry(false);
    setShowInventoryList(true);
    fetchAllProducts();
  };

  const handleDeleteAllProducts = async () => {
    if (window.confirm('Are you sure you want to delete ALL products? This action cannot be undone.')) {
      try {
        const response = await fetch('http://localhost:5000/api/products', {
          method: 'DELETE',
        });
        if (response.ok) {
          setInventory([]);
          setDeleteAllSuccess('All products deleted successfully!');
          setDeleteAllError('');
          setShowInventoryList(true);
          fetchAllProducts();
        } else {
          const error = await response.json();
          console.error('Failed to delete all products:', error);
          setDeleteAllSuccess('');
          setDeleteAllError('Failed to delete all products. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting all products:', error);
        setDeleteAllSuccess('');
        setDeleteAllError('An error occurred while deleting all products.');
      }
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => {
            setShowManualEntry(true);
            setShowScannerEntry(false);
            setShowInventoryList(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-grow"
        >
          Add New Product Manually
        </button>
        <button
          onClick={() => {
            setShowScannerEntry(true);
            setShowManualEntry(false);
            setShowInventoryList(false);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-grow"
        >
          Scan Product Barcode
        </button>
        <button
          onClick={() => {
            setShowInventoryList(true);
            setShowManualEntry(false);
            setShowScannerEntry(false);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex-grow"
        >
          View Inventory List
        </button>
        {/* Hide the Delete All Products button */}
        {/* <button
          onClick={handleDeleteAllProducts}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Delete All Products
        </button> */}
      </div>

      {showManualEntry && <ManualEntryForm onAddItem={handleAddItem} />}
      {showScannerEntry && (
      <div className="bg-white p-4 rounded shadow">
       <h3 className="text-lg font-semibold mb-2">Scan a Product</h3>
        <BarcodeScanner onScanSuccess={fetchProductByBarcode} />
      </div>
      )}


      <div className="mt-8">
        {showInventoryList && ( // Conditionally render the Inventory List heading and table
          <>
            <h3 className="text-xl font-semibold mb-4">Inventory List</h3>
            {deleteAllSuccess && <div className="mt-4 text-green-600">{deleteAllSuccess}</div>}
            {deleteAllError && <div className="mt-4 text-red-600">{deleteAllError}</div>}
            {error && <div className="mt-4 text-red-600">{error}</div>}

            {loading ? (
              <p>Loading products...</p>
            ) : inventory.length === 0 && !error ? (
              <p>No items in inventory.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Product ID</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Name</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Brand</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Model</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Category</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Price</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Quantity</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Description</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Images</th>
                      <th className="py-3 px-4 border-b font-semibold text-left uppercase tracking-wider">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-sm">{item.productId}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.name}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.brand}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.model}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.category}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.price}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.quantity}</td>
                        <td className="py-2 px-4 border-b text-sm">{item.description}</td>
                        <td className="py-2 px-4 border-b text-sm">
                          {item.images && item.images.map((img, index) => (
                            <img key={index} src={img} alt={`Product ${item.name} - Image ${index + 1}`} className="w-16 h-16 object-cover mr-1 rounded" />
                          ))}
                        </td>
                        <td className="py-2 px-4 border-b text-sm">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Inventory;