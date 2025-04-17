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
  const [billingDate, setBillingDate] = useState('');
  const [isBillFinalized, setIsBillFinalized] = useState(false);

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
    const today = new Date().toISOString().slice(0, 10);
    setBillingDate(today);
  }, []);

  const addItem = () => {
    const newItem = {
      itemNo: nextItemNo,
      productId: '',
      nameDescription: '',
      price: 0,
      quantity: 1,
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
            nameDescription: nameDescription,
            price: parseFloat(product.price),
          }
        : item
    );
    setBillingItems(updatedItems);
    setSuggestions([]);
    setSearchTerm(nameDescription);
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
        billingDate,
        items: billingItems.map(item => ({
          productId: item.productId,
          nameDescription: item.nameDescription,
          price: item.price,
          quantity: item.quantity,
        })),
        totalAmount,
      };
      console.log('Final Bill Data:', billData);
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
          console.log('Bill saved successfully:', savedBill);
          alert('Bill finalized and saved successfully!');
        } else {
          const error = await response.json();
          console.error('Failed to save bill:', error);
          alert('Bill finalized, but failed to save.');
        }
      } catch (error) {
        console.error('Error saving bill:', error);
        alert('Bill finalized, but an error occurred while saving.');
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

    doc.setFontSize(20);
    doc.text('Bill', margin, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Customer Name: ${customerName}`, margin, y);
    y += 5;
    doc.text(`Billing Date: ${billingDate}`, margin, y);
    y += 10;

    const headers = ['Item No.', 'Name & Description', 'Price (₹)', 'Quantity', 'Total (₹)'];
    const colWidths = [15, 70, 20, 20, 25];
    let x = margin;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;

    doc.setFont('helvetica', 'normal');
    billingItems.forEach((item) => {
      x = margin;
      doc.text(String(item.itemNo), x, y);
      x += colWidths[0];
      doc.text(item.nameDescription, x, y);
      x += colWidths[1];
      doc.text(item.price.toFixed(2), x, y);
      x += colWidths[2];
      doc.text(String(item.quantity), x, y);
      x += colWidths[3];
      doc.text((item.price * item.quantity).toFixed(2), x, y);
      y += 5;
    });
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, margin, y);

    doc.save(`bill_${billingDate}_${customerName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-semibold mb-4">Billing</h2>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="customerName" className="block text-gray-700 text-sm font-bold mb-2">
            Customer Name:
          </label>
          <input
            type="text"
            id="customerName"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="billingDate" className="block text-gray-700 text-sm font-bold mb-2">
            Billing Date:
          </label>
          <input
            type="date"
            id="billingDate"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            value={billingDate}
            onChange={(e) => setBillingDate(e.target.value)}
          />
        </div>
      </div>

      {!isBillFinalized ? (
        <div className="mb-4 flex gap-2">
          <button onClick={addItem} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Item
          </button>
          <button onClick={handleFinalizeBill} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Finalize Bill
          </button>
        </div>
      ) : (
        <div className="mb-4 flex gap-2">
          <button onClick={handlePrintBill} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
            Print Bill
          </button>
          <button onClick={handleSaveAsPDF} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Save as PDF
          </button>
        </div>
      )}

      {!isBillFinalized ? (
        <div className="overflow-x-auto mt-8">
          <h3 className="text-xl font-semibold mb-4">Billing Items</h3>
          {billingItems.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 border-b">Item No.</th>
                  <th className="py-3 px-4 border-b">Name & Description</th>
                  <th className="py-3 px-4 border-b">Price (₹)</th>
                  <th className="py-3 px-4 border-b">Quantity</th>
                  <th className="py-3 px-4 border-b">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {billingItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{item.itemNo}</td>
                    <td className="py-2 px-4 border-b relative">
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2"
                        value={item.nameDescription}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onFocus={() => setSelectedProductIndex(index)}
                        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                      />
                      {selectedProductIndex === index && suggestions.length > 0 && (
                        <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow-md mt-1 w-full">
                          {suggestions.map((product) => (
                            <li
                              key={product._id}
                              className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                              onMouseDown={() => handleSuggestionClick(index, product)}
                            >
                              {product.name} {product.brand ? `(${product.brand})` : ''} {product.model ? `[${product.model}]` : ''} - ₹{product.price}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">₹{item.price.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b">
                      <input
                        type="number"
                        className="w-24 border rounded px-2 py-1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="1"
                      />
                    </td>
                    <td className="py-2 px-4 border-b">₹{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No items added to the bill yet.</p>
          )}
          <div className="mt-4 text-xl font-semibold">
            Total Amount: ₹{totalAmount.toFixed(2)}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto mt-8">
          <h3 className="text-xl font-semibold mb-4">Final Bill</h3>
          <p>Customer Name: {customerName}</p>
          <p>Billing Date: {billingDate}</p>
          <table className="min-w-full bg-white border border-gray-300 shadow-md rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 border-b">Item No.</th>
                <th className="py-3 px-4 border-b">Name & Description</th>
                <th className="py-3 px-4 border-b">Price (₹)</th>
                <th className="py-3 px-4 border-b">Quantity</th>
                <th className="py-3 px-4 border-b">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item) => (
                <tr key={item.itemNo} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{item.itemNo}</td>
                  <td className="py-2 px-4 border-b">{item.nameDescription}</td>
                  <td className="py-2 px-4 border-b">₹{item.price.toFixed(2)}</td>
                  <td className="py-2 px-4 border-b">{item.quantity}</td>
                  <td className="py-2 px-4 border-b">₹{(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-xl font-semibold">
            Total Amount: ₹{totalAmount.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
