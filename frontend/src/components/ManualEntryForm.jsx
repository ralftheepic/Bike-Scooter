import React, { useState } from 'react';

const autoPartNames = [
  'Accelerator cable (Throttle cable)',
  'Air filter',
  'Alloy wheels',
  'Axle',
  'Battery',
  'Brake caliper',
  'Brake cables',
  'Brake disc (disc rotor)',
  'Brake drum',
  'Brake fluid reservoir',
  'Brake lever',
  'Brake light switch',
  'Brake pads',
  'Brake pedal',
  'Brake shoes',
  'Camshaft',
  'Carburetor / Fuel injector',
  'CDI unit',
  'Chain cover',
  'Chain sprockets (front & rear)',
  'Chain tensioner',
  'Chassis/frame',
  'Clutch cable',
  'Clutch lever',
  'Clutch plate',
  'Crash guard',
  'Crankshaft',
  'Cylinder head',
  'Drive chain / Belt',
  'Engine block',
  'Fairing / Windshield (for some bikes)',
  'Foot pegs',
  'Foot rest',
  'Front fork',
  'Fuel lines',
  'Fuel pump',
  'Fuel tank',
  'Fuel tank cap',
  'Fuel tap (petcock)',
  'Fuse box',
  'Gear shift lever',
  'Gearbox',
  'Grab rail',
  'Handlebar',
  'Headlight',
  'Horn',
  'Ignition switch',
  'Kick starter / Electric starter',
  'Kickstand sensor',
  'Lock set (ignition, fuel, seat)',
  'Master cylinder',
  'Mudguard (front/rear)',
  'Number plate bracket',
  'Odometer',
  'Oil filter',
  'Piston',
  'Rear shock absorber',
  'Rearview mirrors',
  'Regulator/rectifier',
  'Seat',
  'Side panels',
  'Side stand / Main stand',
  'Side stand switch',
  'Spark plug',
  'Speedometer',
  'Spoke wheels',
  'Swing arm',
  'Tail light',
  'Timing chain/belt',
  'Tires',
  'Turn signal indicators',
  'Universal Item',
  'Valves',
  'Wheel bearings',
  'Wheel rim',
  'Wiring harness'
];

const brandOptions = [
  'Amaron',
  'Bajaj',
  'Hero',
  'Honda',
  'Rolon',
  'RoyalEnfield',
  'Suzuki',
  'TVS',
  'Yamaha'
];

const modelOptions = {
  Amaron: [
    'AP-ATZ6L',
    'AP-BTX5L',
    'AP-BTX7R',
    'AP-BTX9',
    'AP-BTZ4L',
    'AP-BTZ5L',
    'AP-BTZ7L',
    'AP-BTZ9R'
  ],
  Bajaj: [
    'Avenger 150',
    'Avenger 220',
    'Avenger Cruise',
    'CT100',
    'Discover 100',
    'Pulsar',
    'Pulsar 200',
    'Universal'
  ],
  Hero: [
    'Activa',
    'Duet',
    'Destiny',
    'Destiny bs6',
    'HF Deluxe',
    'Masetro Edge',
    'Passion 2020',
    'Passion Plus',
    'Passion Pro',
    'Pleasure',
    'Pleasure BS6',
    'Shine',
    'Shine BS6',
    'Super Splendour',
    'Splendour plus',
    'Splendor',
    'Splendor bs6',
    'Splendour Old',
    'Unicorn',
    'Universal',
    'XPro',
    'Xpulse',
    'Xpulse 4 valv',
    'Zoom'
  ],
  Honda: [
    'Activa',
    'Activa 3g/4g',
    'Activa 6g',
    'Activa 6g B',
    'Activa 6g 2020 A',
    'Activa 6g 2020 B',
    'Activa 6g 2021',
    'Activa 6g 2021 A',
    'Activa 6g 2021 B',
    'Activa 6g 2022 A',
    'Activa 6g 2022 B',
    'Activa 6g Lock',
    'Activa 6g Nut',
    'Dio',
    'Dream Yoga',
    'Hornet',
    'Shine',
    'Shine BS4',
    'Shine BS6',
    'Unicorn',
    'Unicorn BS6',
    'Universal'
  ],
  Rolon: [
    'FZ16/FZS/FAZER',
    'Hiness 350',
    'Raider 125',
    'Unicorn'
  ],
  RoyalEnfield: [
    'Electra',
    'Hunter',
    'Reborn',
    'ThunderBird',
    'classic',
    'Universal'
  ],
  Suzuki: [
    'Access',
    'Avenis',
    'Burgman',
    'Gixer',
    'Universal'
  ],
  TVS: [
    'Apache',
    'Apache 160',
    'Apache 200',
    'Jupiter',
    'Ntorq',
    'Universal'
  ],
  Yamaha: [
    'FZ',
    'FZ V2',
    'FZ v1 v2',
    'FZ v3',
    'MT 15',
    'R15',
    'R15 v3',
    'RayZR',
    'Universal'
  ]
};

const distributorOptions = [
  'Amaron Battery',
  'Bajaj sai services',
  'Hero kiran',
  'Honda Shanti',
  'MehtaAutomobile',
  'Rolon',
  'RoyalEnfield Rajkamal',
  'Suzuki',
  'TVS SaiBaba',
  'Yahama SaiBaba'
];


const ManualEntryForm = ({ onBulkOrderAdded }) => {
  const [distributorSource, setDistributorSource] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalBillAmount, setTotalBillAmount] = useState('');
  const [orderItems, setOrderItems] = useState([]);

  const [newProductId, setNewProductId] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductModel, setNewProductModel] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('bike');
  const [newQuantityReceived, setNewQuantityReceived] = useState('');
  const [newPurchasePrice, setNewPurchasePrice] = useState('');
  const [newProductPartNo, setNewProductPartNo] = useState('');

  const [editingIndex, setEditingIndex] = useState(null);
  const [editFormData, setEditFormData] = useState({
    productId: '',
    name: '',
    brand: '',
    model: '',
    category: 'bike',
    quantityReceived: '',
    purchasePrice: '',
    partNumber: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleBrandChange = (e) => {
    const brand = e.target.value;
    setNewProductBrand(brand);
    setNewProductModel('');
  };

  const handleEditBrandChange = (e) => {
    const brand = e.target.value;
    setEditFormData((prev) => ({
      ...prev,
      brand,
      model: '',
    }));
  };

  const handleAddOrderItem = () => {
    if (
      !newProductId ||
      !newProductName ||
      !newProductModel ||
      !newQuantityReceived ||
      !newPurchasePrice ||
      !newProductCategory
    ) {
      alert('Please fill in all required fields for the product.');
      return;
    }

    const quantity = parseInt(newQuantityReceived, 10);
    const price = parseFloat(newPurchasePrice);

    setOrderItems([
      ...orderItems,
      {
        productId: newProductId,
        name: newProductName,
        brand: newProductBrand,
        model: newProductModel,
        category: newProductCategory,
        quantityReceived: quantity,
        purchasePrice: price,
        partNumber: newProductPartNo,
      },
    ]);

    setNewProductId('');
    setNewProductName('');
    setNewProductBrand('');
    setNewProductModel('');
    setNewProductCategory('bike');
    setNewQuantityReceived('');
    setNewPurchasePrice('');
    setNewProductPartNo('');
  };

  const handleRemoveOrderItem = (index) => {
    const updated = orderItems.filter((_, i) => i !== index);
    setOrderItems(updated);
  };

  const handleEditOrderItem = (index) => {
    setEditingIndex(index);
    setEditFormData({ ...orderItems[index] });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    const updatedItems = [...orderItems];
    updatedItems[editingIndex] = {
      ...editFormData,
      quantityReceived: parseInt(editFormData.quantityReceived, 10),
      purchasePrice: parseFloat(editFormData.purchasePrice),
    };
    setOrderItems(updatedItems);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => setEditingIndex(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const calculatedTotal = orderItems.reduce((sum, item) => sum + item.quantityReceived * item.purchasePrice, 0);
    if (parseFloat(totalBillAmount) !== calculatedTotal) {
      alert(`Total bill amount (${totalBillAmount}) does not match the calculated total (${calculatedTotal}).`);
      return;
    }

    const bulkOrder = {
      distributorSource,
      receiptDate,
      totalBillAmount: parseFloat(totalBillAmount),
      items: orderItems,
    };

    try {
      const response = await fetch('http://localhost:5000/api/bulk-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulkOrder),
      });

      if (response.ok) {
        const addedOrder = await response.json();
        console.log('Bulk order added:', addedOrder);
        setSuccessMessage('Bulk order added successfully!');
        setErrorMessage('');
        if (onBulkOrderAdded) onBulkOrderAdded(addedOrder);
        resetForm();
      } else {
        const error = await response.json();
        setSuccessMessage('');
        setErrorMessage(error.message || 'Failed to add bulk order.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An error occurred. Please try again.');
      setSuccessMessage('');
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
    setNewProductPartNo('');
    setEditingIndex(null);
    setEditFormData({
      productId: '',
      name: '',
      brand: '',
      model: '',
      category: 'bike',
      quantityReceived: '',
      purchasePrice: '',
      partNumber: '',
    });
  };

  const calculatedTotal = orderItems.reduce((sum, item) => sum + item.quantityReceived * item.purchasePrice, 0);

  return (
    <div className="bg-white p-6 shadow rounded">
      <h2 className="text-xl font-bold mb-4">Bulk Order Entry</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">Distributor</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={distributorSource}
            onChange={(e) => setDistributorSource(e.target.value)}
            required
          >
            <option value="">Select Distributor</option>
            {distributorOptions.map((dist) => (
              <option key={dist} value={dist}>{dist}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Receipt Date</label>
          <input type="date" className="w-full border px-3 py-2 rounded" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Total Bill Amount</label>
          <input type="number" className="w-full border px-3 py-2 rounded" value={totalBillAmount} onChange={(e) => setTotalBillAmount(e.target.value)} required />
        </div>

        {/* Product Entry Section */}
        <div className="md:col-span-2 mt-4 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Add Product</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <input placeholder="ID" value={newProductId} onChange={(e) => setNewProductId(e.target.value)} className="border px-2 py-1 rounded" />
            
            <select value={newProductName} onChange={(e) => setNewProductName(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">Select Part Name</option>
                  {autoPartNames.map((part) => (
                  <option key={part} value={part}>{part}</option>
                  ))} 
            </select>
            <select value={newProductBrand} onChange={handleBrandChange} className="border px-2 py-1 rounded">
              <option value="">Select Brand</option>
              {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <select value={newProductModel} onChange={(e) => setNewProductModel(e.target.value)} className="border px-2 py-1 rounded">
              <option value="">Select Model</option>
              {(modelOptions[newProductBrand] || []).map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
            <input placeholder="Part No" value={newProductPartNo} onChange={(e) => setNewProductPartNo(e.target.value)} className="border px-2 py-1 rounded" />
            <select value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)} className="border px-2 py-1 rounded">
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
            </select>
            <input placeholder="Qty" type="number" value={newQuantityReceived} onChange={(e) => setNewQuantityReceived(e.target.value)} className="border px-2 py-1 rounded" />
            <input placeholder="Unit Price" type="number" value={newPurchasePrice} onChange={(e) => setNewPurchasePrice(e.target.value)} className="border px-2 py-1 rounded" />
          </div>

          <div className="mt-2">
            <button type="button" onClick={handleAddOrderItem} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Add Item
            </button>
          </div>

          {orderItems.length > 0 && (
            <div className="mt-4 overflow-auto">
              <table className="w-full border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-2 py-1">ID</th>
                    <th className="px-2 py-1">Name</th>
                    <th className="px-2 py-1">Brand</th>
                    <th className="px-2 py-1">Model</th>
                    <th className="px-2 py-1">Part No</th>
                    <th className="px-2 py-1">Category</th>
                    <th className="px-2 py-1">Qty</th>
                    <th className="px-2 py-1">Price</th>
                    <th className="px-2 py-1">Subtotal</th>
                    <th className="px-2 py-1">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderItems.map((item, index) => (
                    <tr key={index}>
                      {editingIndex === index ? (
                        <>
                          <td><input name="productId" value={editFormData.productId} onChange={handleEditFormChange} className="w-full border" /></td>
                          <td><input name="name" value={editFormData.name} onChange={handleEditFormChange} className="w-full border" /></td>
                          <td>
                            <select name="brand" value={editFormData.brand} onChange={handleEditBrandChange} className="w-full border">
                              <option value="">Select</option>
                              {brandOptions.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                            </select>
                          </td>
                          <td>
                            <select name="model" value={editFormData.model} onChange={handleEditFormChange} className="w-full border">
                              <option value="">Select</option>
                              {(modelOptions[editFormData.brand] || []).map((model) => <option key={model} value={model}>{model}</option>)}
                            </select>
                          </td>
                          <td><input name="partNumber" value={editFormData.partNumber} onChange={handleEditFormChange} className="w-full border" /></td>
                          <td>
                            <select name="category" value={editFormData.category} onChange={handleEditFormChange} className="w-full border">
                              <option value="bike">Bike</option>
                              <option value="scooter">Scooter</option>
                            </select>
                          </td>
                          <td><input name="quantityReceived" type="number" value={editFormData.quantityReceived} onChange={handleEditFormChange} className="w-full border" /></td>
                          <td><input name="purchasePrice" type="number" value={editFormData.purchasePrice} onChange={handleEditFormChange} className="w-full border" /></td>
                          <td>{(editFormData.quantityReceived * editFormData.purchasePrice).toFixed(2)}</td>
                          <td>
                            <button onClick={handleSaveEdit} className="text-green-600 mr-2">Save</button>
                            <button onClick={handleCancelEdit} className="text-gray-600">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{item.productId}</td>
                          <td>{item.name}</td>
                          <td>{item.brand}</td>
                          <td>{item.model}</td>
                          <td>{item.partNumber}</td>
                          <td>{item.category}</td>
                          <td>{item.quantityReceived}</td>
                          <td>{item.purchasePrice}</td>
                          <td>{(item.quantityReceived * item.purchasePrice).toFixed(2)}</td>
                          <td>
                            <button onClick={() => handleEditOrderItem(index)} className="text-blue-600 mr-2">Edit</button>
                            <button onClick={() => handleRemoveOrderItem(index)} className="text-red-600">Remove</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 text-right font-semibold">Total: ₹{calculatedTotal.toFixed(2)}</div>
            </div>
          )}
        </div>

        <div className="md:col-span-2 text-right mt-4">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700" disabled={editingIndex !== null}>
            Submit Bulk Order
          </button>
        </div>
      </form>

      {successMessage && <div className="mt-4 text-green-600">{successMessage}</div>}
      {errorMessage && <div className="mt-4 text-red-600">{errorMessage}</div>}
    </div>
  );
};

export default ManualEntryForm;
