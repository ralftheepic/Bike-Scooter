import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';

const Billing = () => {
  const [billingItems, setBillingItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [nextItemNo, setNextItemNo] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [billingDate, setBillingDate] = useState('');
  const [isBillFinalized, setIsBillFinalized] = useState(false);
  const [currentDraftBillId, setCurrentDraftBillId] = useState(null);
  const [draftBillsList, setDraftBillsList] = useState([]);

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

  const fetchDraftBills = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bills?isDraft=true');
      if (response.ok) {
        const data = await response.json();
        setDraftBillsList(data);
      } else {
        console.error('Failed to fetch draft bills');
      }
    } catch (error) {
      console.error('Error fetching draft bills:', error);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchDraftBills();
    const today = new Date().toISOString().slice(0, 10);
    setBillingDate(today);
  }, []);

  const saveDraftBill = async () => {
    const existingBill = draftBillsList.find(
      (bill) =>
        bill.customerName === customerName &&
        bill.customerPhoneNumber === customerPhoneNumber &&
        bill.billingDate === billingDate
    );

    const billData = {
      customerName,
      customerPhoneNumber,
      billingDate,
      items: billingItems.map(item => ({
        productId: item.productId,
        nameDescription: item.nameDescription,
        price: item.price,
        quantity: item.quantity,
        partNumber: item.partNumber,
      })),
      totalAmount,
      isDraft: true,
    };

    if (existingBill) {
      try {
        const response = await fetch(`http://localhost:5000/api/bills/${existingBill._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        });

        if (response.ok) {
          alert(`Draft bill updated with ID: ${existingBill._id}`);
          setCurrentDraftBillId(existingBill._id);
          fetchDraftBills();
        } else {
          const error = await response.json();
          alert(`Failed to update draft bill: ${error.message || 'Unknown error'}`);
        }
      } catch (error) {
        alert('Error updating draft bill.');
      }
    } else {
      try {
        const response = await fetch('http://localhost:5000/api/bills', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        });

        if (response.ok) {
          const savedBill = await response.json();
          alert(`Draft bill saved with ID: ${savedBill._id}`);
          setCurrentDraftBillId(savedBill._id);
          fetchDraftBills();
        } else {
          const error = await response.json();
          alert(`Failed to save draft bill: ${error.message || 'Unknown error'}`);
        }
      } catch (error) {
        alert('Error saving draft bill.');
      }
    }
  };

  const loadDraftBill = async (draftBillId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bills/${draftBillId}`);
      if (response.ok) {
        const data = await response.json();
        setBillingItems(data.items.map((item, index) => ({ ...item, itemNo: index + 1 })));
        setCustomerName(data.customerName);
        setCustomerPhoneNumber(data.customerPhoneNumber || '');
        setBillingDate(data.billingDate.slice(0, 10));
        setTotalAmount(data.totalAmount);
        setIsBillFinalized(false);
        setCurrentDraftBillId(data._id);
        setNextItemNo(data.items.length + 1);
      } else {
        alert('Failed to load draft bill.');
      }
    } catch (error) {
      alert('Error loading draft bill.');
    }
  };

  const addItem = () => {
    const newItem = {
      itemNo: nextItemNo,
      productId: '',
      nameDescription: '',
      price: 0,
      quantity: 1,
      partNumber: '',
    };
    setBillingItems([...billingItems, newItem]);
    setNextItemNo(nextItemNo + 1);
  };

  const handleInputChange = (index, value) => {
    const updatedItems = [...billingItems];
    updatedItems[index].nameDescription = value;
    setBillingItems(updatedItems);
    setSearchTerm(value);
    setSelectedProductIndex(index);

    if (value.length > 0) {
      const filteredSuggestions = inventory.filter((product) =>
        `${product.name} ${product.brand || ''} ${product.model || ''}`.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (index, product) => {
    const nameDescription = `${product.name} ${product.brand ? `(${product.brand})` : ''} ${product.model ? `[${product.model}]` : ''} - ${product.description || ''}`;
    const updatedItems = billingItems.map((item, i) =>
      i === index
        ? {
            ...item,
            productId: product._id,
            nameDescription: product.partNumber ? `${nameDescription} (Part No: ${product.partNumber})` : nameDescription,
            price: parseFloat(product.price),
            name: product.name,
            brand: product.brand,
            model: product.model,
            partNumber: product.partNumber,
          }
        : item
    );
    setBillingItems(updatedItems);
    setSuggestions([]);
    setSearchTerm('');
    setSelectedProductIndex(-1);
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...billingItems];
    updatedItems[index].quantity = parseInt(quantity, 10) >= 0 ? parseInt(quantity, 10) : 0;
    setBillingItems(updatedItems);
  };

  useEffect(() => {
    const newTotal = billingItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(newTotal);
  }, [billingItems]);

  const handleFinalizeBill = async () => {
    if (billingItems.length > 0 && customerName && billingDate) {
      setIsBillFinalized(true);
      const billData = {
        customerName,
        customerPhoneNumber,
        billingDate,
        items: billingItems.map(item => ({
          productId: item.productId,
          nameDescription: item.nameDescription,
          price: item.price,
          quantity: item.quantity,
          partNumber: item.partNumber,
        })),
        totalAmount,
        isDraft: false,
      };
      const apiUrl = currentDraftBillId ? `http://localhost:5000/api/bills/${currentDraftBillId}` : 'http://localhost:5000/api/bills';
      const method = currentDraftBillId ? 'PUT' : 'POST';

      try {
        const response = await fetch(apiUrl, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        });
        if (response.ok) {
          alert('Bill finalized and saved successfully!');
          setCurrentDraftBillId(null);
          handleNewBill();
          fetchDraftBills();
        } else {
          const error = await response.json();
          alert(`Bill finalized, but failed to save: ${error.message || 'Unknown error'}`);
          setIsBillFinalized(false);
        }
      } catch (error) {
        alert('Bill finalized, but an error occurred while saving.');
        setIsBillFinalized(false);
      }
    } else {
      alert('Please add items and ensure customer name and date are filled.');
    }
  };

  const handlePrintBill = () => {
    window.print();
  };

  const handleSaveAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;
    const xRight = pageWidth - margin;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Shankar Automobile & Shankar Bike Garage', xRight, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text('Laxmi Avenue D, Global City', xRight, y, { align: 'right' });
    y += 5;
    doc.text('Virar West - 401303', xRight, y, { align: 'right' });
    y += 5;
    doc.text('9322516441', xRight, y, { align: 'right' });
    y += 15;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const billText = `Bill ID: ${currentDraftBillId} - ${customerName}`;
    doc.text(billText, margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Billing Date: ${billingDate}`, margin, y);
    y += 10;
    doc.text(`Phone: ${customerPhoneNumber}`, margin, y);
    y += 10;

    doc.autoTable({
      startY: y,
      head: [['Item No', 'Product', 'Price', 'Quantity', 'Total']],
      body: billingItems.map(item => [
        item.itemNo,
        item.nameDescription,
        item.price.toFixed(2),
        item.quantity,
        (item.price * item.quantity).toFixed(2),
      ]),
    });

    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, xRight, doc.lastAutoTable.finalY + 10, { align: 'right' });
    doc.save(`bill-${currentDraftBillId}.pdf`);
  };

  const handleNewBill = () => {
    setBillingItems([]);
    setTotalAmount(0);
    setCustomerName('');
    setCustomerPhoneNumber('');
    setBillingDate('');
    setIsBillFinalized(false);
    setNextItemNo(1);
    setSearchTerm('');
    setSuggestions([]);
    setCurrentDraftBillId(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Billing</h1>
      <div className="mt-4">
        <label className="block">Customer Name:</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full py-2 px-3 mb-4 border rounded"
          placeholder="Enter customer name"
          disabled={isBillFinalized}
        />
        <label className="block">Customer Phone:</label>
        <input
          type="text"
          value={customerPhoneNumber}
          onChange={(e) => setCustomerPhoneNumber(e.target.value)}
          className="w-full py-2 px-3 mb-4 border rounded"
          placeholder="Enter customer phone"
          disabled={isBillFinalized}
        />
        <label className="block">Billing Date:</label>
        <input
          type="date"
          value={billingDate}
          onChange={(e) => setBillingDate(e.target.value)}
          className="w-full py-2 px-3 mb-4 border rounded"
          disabled={isBillFinalized}
        />
      </div>
      <div className="mt-4">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
          onClick={addItem}
          disabled={isBillFinalized}
        >
          Add Item
        </button>
        <button
          className="bg-green-500 text-white py-2 px-4 rounded mb-4 ml-4"
          onClick={saveDraftBill}
          disabled={isBillFinalized}
        >
          Save Draft Bill
        </button>
      </div>

      {billingItems.length > 0 && (
        <div className="mt-4">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2">Item No.</th>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Quantity</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2">{item.itemNo}</td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.nameDescription}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      placeholder="Enter product"
                      className="w-full py-1 px-2 mb-2 border rounded"
                      disabled={isBillFinalized}
                    />
                    {selectedProductIndex === index && (
                      <ul className="absolute bg-white border rounded w-full z-10">
                        {suggestions.map((product) => (
                          <li
                            key={product._id}
                            onClick={() => handleSuggestionClick(index, product)}
                            className="p-2 cursor-pointer hover:bg-gray-200"
                          >
                            {`${product.name} ${product.brand} ${product.model}`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-2">{item.price}</td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-12"
                      disabled={isBillFinalized}
                    />
                  </td>
                  <td className="px-4 py-2">{(item.price * item.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isBillFinalized}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <span className="font-bold">Total Amount: ₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded mb-4"
          onClick={handleFinalizeBill}
          disabled={isBillFinalized}
        >
          Finalize Bill
        </button>
        <button
          className="bg-yellow-500 text-white py-2 px-4 rounded mb-4 ml-4"
          onClick={handlePrintBill}
          disabled={isBillFinalized}
        >
          Print Bill
        </button>
        <button
          className="bg-purple-500 text-white py-2 px-4 rounded mb-4 ml-4"
          onClick={handleSaveAsPDF}
          disabled={isBillFinalized}
        >
          Save as PDF
        </button>
      </div>

      <div className="mt-4">
        <h2 className="text-xl">Draft Bills</h2>
        <ul>
          {draftBillsList.map((bill) => (
            <li key={bill._id} className="flex justify-between items-center">
              <span>{`Bill ID: ${bill._id} - ${bill.customerName} - ₹${bill.totalAmount.toFixed(2)}`}</span>
              <button
                onClick={() => loadDraftBill(bill._id)}
                className="bg-gray-500 text-white py-1 px-2 rounded"
              >
                Load
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Billing;
