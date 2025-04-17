import React, { useState, useEffect } from 'react';

const ManualEntryForm = ({ onBulkOrderAdded }) => {
  const [distributorSource, setDistributorSource] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalBillAmount, setTotalBillAmount] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [inventory, setInventory] = useState([]);

  const [newProductId, setNewProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductModel, setNewProductModel] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('bike');
  const [newQuantityReceived, setNewQuantityReceived] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        console.error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddOrderItem = () => {
    if (newProductId && newProductName && newQuantityReceived && newPurchasePrice && newProductCategory) {
      const quantity = parseInt(newQuantityReceived, 10);
      const purchasePrice = parseFloat(newPurchasePrice);

      setOrderItems([
        ...orderItems,
        {
          productId: newProductId,
          name: newProductName,
          brand: newProductBrand,
          model: newProductModel,
          category: newProductCategory,
          quantityReceived: quantity,
          purchasePrice: purchasePrice,
          price: purchasePrice, // required by Product schema
        },
      ]);
      setNewProductId('');
      setNewProductName('');
      setNewProductBrand('');
      setNewProductModel('');
      setNewProductCategory('bike');
      setNewQuantityReceived('');
      setNewPurchasePrice('');
    } else {
      alert('Please fill in all product details to add to the order.');
    }
  };

  const handleRemoveOrderItem = (index) => {
    const newOrderItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(newOrderItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const calculatedTotal = orderItems.reduce(
      (sum, item) => sum + item.quantityReceived * item.purchasePrice,
      0
    );

    if (parseFloat(totalBillAmount) !== calculatedTotal) {
      alert(`Total bill amount (${totalBillAmount}) does not match the calculated total (${calculatedTotal}).`);
      return;
    }

    const newBulkOrder = {
      distributorSource,
      receiptDate,
      totalBillAmount: parseFloat(totalBillAmount),
      items: orderItems,
    };

    try {
      const response = await fetch('http://localhost:5000/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBulkOrder),
      });

      if (response.ok) {
        const addedOrder = await response.json();
        setSuccessMessage('Bulk order added successfully!');
        setErrorMessage('');
        if (onBulkOrderAdded) onBulkOrderAdded(addedOrder);
        resetForm();
      } else {
        const error = await response.json();
        console.error('Error adding bulk order:', error);
        setSuccessMessage('');
        setErrorMessage(error.message || 'Failed to add bulk order.');
      }
    } catch (error) {
      console.error('Error adding bulk order:', error);
      setSuccessMessage('');
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  const resetForm = () => {
    setDistributorSource('');
    setReceiptDate(new Date().toISOString().slice(0, 10));
    setTotalBillAmount('');
    setOrderItems([]);
    setNewProductId('');
    setNewProductName('');
    setNewProductBrand('');
    setNewProductModel('');
    setNewProductCategory('bike');
    setNewQuantityReceived('');
    setNewPurchasePrice('');
  };

  const calculatedTotal = orderItems.reduce(
    (sum, item) => sum + item.quantityReceived * item.purchasePrice,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-xl font-semibold mb-4">Bulk Order Entry</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Distributor Details */}
        <div>
          <label className="block mb-1 font-semibold">Distributor Source</label>
          <input type="text" className="w-full border rounded px-3 py-2" value={distributorSource} onChange={(e) => setDistributorSource(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Receipt Date</label>
          <input type="date" className="w-full border rounded px-3 py-2" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Total Bill Amount</label>
          <input type="number" className="w-full border rounded px-3 py-2" value={totalBillAmount} onChange={(e) => setTotalBillAmount(e.target.value)} required />
        </div>

        {/* Product Entry */}
        <div className="col-span-full mt-4 border-t pt-4">
          <h4 className="text-lg font-semibold mb-2">Add Order Items</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-2">
            <input type="text" placeholder="Product ID" className="border rounded px-2 py-1" value={newProductId} onChange={(e) => setNewProductId(e.target.value)} />
            <input type="text" placeholder="Name" className="border rounded px-2 py-1" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} />
            <input type="text" placeholder="Brand" className="border rounded px-2 py-1" value={newProductBrand} onChange={(e) => setNewProductBrand(e.target.value)} />
            <input type="text" placeholder="Model" className="border rounded px-2 py-1" value={newProductModel} onChange={(e) => setNewProductModel(e.target.value)} />
            <select className="border rounded px-2 py-1" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
            </select>
            <input type="number" placeholder="Quantity" className="border rounded px-2 py-1" value={newQuantityReceived} onChange={(e) => setNewQuantityReceived(e.target.value)} />
            <input type="number" placeholder="Purchase Price" className="border rounded px-2 py-1" value={newPurchasePrice} onChange={(e) => setNewPurchasePrice(e.target.value)} />
            <div className="col-span-full mt-2">
              <button type="button" onClick={handleAddOrderItem} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add Item to Order
              </button>
            </div>
          </div>

          {/* Order Item Table */}
          {orderItems.length > 0 && (
            <div className="overflow-x-auto mt-4">
              <h5 className="font-semibold mb-2">Order Items:</h5>
              <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4">ID</th>
                    <th className="py-2 px-4">Name</th>
                    <th className="py-2 px-4">Brand</th>
                    <th className="py-2 px-4">Model</th>
                    <th className="py-2 px-4">Category</th>
                    <th className="py-2 px-4">Qty</th>
                    <th className="py-2 px-4">Price</th>
                    <th className="py-2 px-4">Subtotal</th>
                    <th className="py-2 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm">{item.productId}</td>
                      <td className="py-2 px-4 text-sm">{item.name}</td>
                      <td className="py-2 px-4 text-sm">{item.brand}</td>
                      <td className="py-2 px-4 text-sm">{item.model}</td>
                      <td className="py-2 px-4 text-sm">{item.category}</td>
                      <td className="py-2 px-4 text-sm">{item.quantityReceived}</td>
                      <td className="py-2 px-4 text-sm">{item.purchasePrice}</td>
                      <td className="py-2 px-4 text-sm">{(item.quantityReceived * item.purchasePrice).toFixed(2)}</td>
                      <td className="py-2 px-4 text-sm">
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleRemoveOrderItem(index)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 font-semibold">Calculated Total: ₹{calculatedTotal.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 text-right mt-4">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Add Bulk Order
          </button>
        </div>
      </form>

      {successMessage && <div className="mt-4 text-green-600">{successMessage}</div>}
      {errorMessage && <div className="mt-4 text-red-600">{errorMessage}</div>}
    </div>
  );
};

export default ManualEntryForm;
