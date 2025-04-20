import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Import the autotable plugin

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
  const [isBillFinalized, setIsBillFinalized] = useState(false); // Tracks if the *current view* is of a finalized bill or during finalization process
  const [currentDraftBillId, setCurrentDraftBillId] = useState(null); // ID of the draft currently loaded/being worked on
  const [finalizedBillId, setFinalizedBillId] = useState(null); // ID of the bill *after* it has been successfully finalized
  const [draftBillsList, setDraftBillsList] = useState([]);

  // --- Data Fetching ---

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        console.error('Failed to fetch inventory. Status:', response.status);
        alert('Failed to fetch inventory items.');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Error connecting to server to fetch inventory.');
    }
  };

  const fetchDraftBills = async () => {
    try {
      // The endpoint GET /api/bills should fetch *only* drafts based on backend logic
      const response = await fetch('http://localhost:5000/api/bills');
      if (response.ok) {
        const data = await response.json();
        setDraftBillsList(data);
      } else if (response.status === 404) {
         setDraftBillsList([]); // No drafts found is not an error
         console.log('No draft bills found.');
      } else {
        console.error('Failed to fetch draft bills. Status:', response.status);
         alert('Failed to fetch draft bills.');
      }
    } catch (error) {
      console.error('Error fetching draft bills:', error);
      alert('Error connecting to server to fetch draft bills.');
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchDraftBills();
    const today = new Date().toISOString().slice(0, 10);
    setBillingDate(today);
  }, []);

  // --- Draft Bill Handling ---

  const saveDraftBill = async () => {
     if (!customerName && !customerPhoneNumber) {
         alert('Please enter Customer Name or Phone Number to save a draft.');
         return;
     }
     if (billingItems.length === 0) {
         alert('Please add items before saving a draft.');
         return;
     }

    // Note: Finding existing bill by name/date/phone might overwrite unrelated drafts.
    // Prioritizing update via currentDraftBillId is safer if a draft is already loaded.
    const billToUpdate = currentDraftBillId ? draftBillsList.find(b => b._id === currentDraftBillId) : null;

    const billData = {
      customerName,
      customerPhoneNumber,
      billingDate,
      items: billingItems.map(item => ({
        productId: item.productId, // Ensure productId is correctly populated
        nameDescription: item.nameDescription,
        price: item.price,
        quantity: item.quantity,
        partNumber: item.partNumber || '', // Ensure partNumber exists
      })),
      totalAmount,
      isDraft: true,
    };

    let apiUrl;
    let method;

    if (billToUpdate) {
        // Update the currently loaded draft
        apiUrl = `http://localhost:5000/api/bills/${currentDraftBillId}`;
        method = 'PUT';
    } else {
        // Save as a new draft
        apiUrl = 'http://localhost:5000/api/bills';
        method = 'POST';
    }

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
      });

      if (response.ok) {
        const savedBill = await response.json();
        alert(`Draft bill ${method === 'POST' ? 'saved' : 'updated'} successfully with ID: ${savedBill._id}`);
        setCurrentDraftBillId(savedBill._id); // Ensure current ID is set/updated
        fetchDraftBills(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to ${method === 'POST' ? 'save' : 'update'} draft bill: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${method === 'POST' ? 'saving' : 'updating'} draft bill:`, error);
      alert(`Error connecting to server to ${method === 'POST' ? 'save' : 'update'} draft bill.`);
    }
  };

  const loadDraftBill = async (draftBillId) => {
    // Reset state before loading
    handleNewBill(); // Clear existing form state

    try {
      const response = await fetch(`http://localhost:5000/api/bills/${draftBillId}`);

      if (response.ok) {
        const data = await response.json();

        // Basic validation of loaded data
        if (!data || !data.items || data.customerName === undefined) {
            alert('Incomplete draft bill data received from server.');
            return;
        }

        setBillingItems(data.items.map((item, index) => ({
            ...item,
            itemNo: index + 1,
            // Ensure defaults if properties are missing (though schema should handle this)
            price: item.price || 0,
            quantity: item.quantity || 1,
        })));
        setCustomerName(data.customerName);
        setCustomerPhoneNumber(data.customerPhoneNumber || '');
        // Ensure date is correctly formatted YYYY-MM-DD
        setBillingDate(data.billingDate ? new Date(data.billingDate).toISOString().slice(0, 10) : '');
        setTotalAmount(data.totalAmount || 0);
        setIsBillFinalized(false); // Loading a draft means it's not finalized yet
        setFinalizedBillId(null); // Clear any previous finalized ID
        setCurrentDraftBillId(data._id); // Set the ID of the loaded draft
        setNextItemNo(data.items.length + 1);

      } else {
         const error = await response.json();
         alert(`Failed to load draft bill: ${error.message || response.statusText}`);
      }
    } catch (error) {
      console.error('Error loading draft bill:', error);
      alert('Error connecting to server to load draft bill.');
    }
  };

  // --- Billing Item Management ---

  const addItem = () => {
    const newItem = {
      itemNo: nextItemNo,
      productId: '', // Initialize productId
      nameDescription: '',
      price: 0,
      quantity: 1,
      partNumber: '', // Initialize partNumber
    };
    setBillingItems([...billingItems, newItem]);
    setNextItemNo(nextItemNo + 1);
  };

  const handleInputChange = (index, value) => {
    const updatedItems = [...billingItems];
    updatedItems[index].nameDescription = value;
    setBillingItems(updatedItems);
    setSearchTerm(value);
    setSelectedProductIndex(index); // Show suggestions for the currently focused input

    if (value.length > 1) { // Trigger search after 2+ characters
      const filteredSuggestions = inventory.filter((product) =>
        `${product.name} ${product.brand || ''} ${product.model || ''} ${product.partNumber || ''} ${product.description || ''}`
          .toLowerCase()
          .includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions.slice(0, 10)); // Show top 10 suggestions
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (index, product) => {
    const nameDescription = `${product.name} ${product.brand ? `(${product.brand})` : ''} ${product.model ? `[${product.model}]` : ''} ${product.partNumber ? `- PartNo: ${product.partNumber}` : ''} ${product.description ? `- ${product.description}` : ''}`;

    const updatedItems = billingItems.map((item, i) =>
      i === index
        ? {
            ...item,
            productId: product._id, // Store the product ID
            nameDescription: nameDescription,
            price: parseFloat(product.price || 0), // Ensure price is a number
            name: product.name, // Keep other details if needed elsewhere
            brand: product.brand,
            model: product.model,
            partNumber: product.partNumber || '', // Store part number
            // Reset quantity to 1 when selecting a new product? Or keep existing?
            // quantity: 1,
          }
        : item
    );
    setBillingItems(updatedItems);
    setSuggestions([]); // Clear suggestions
    setSearchTerm(''); // Clear search term
    setSelectedProductIndex(-1); // Hide suggestion list
  };

  const handleQuantityChange = (index, quantity) => {
    const updatedItems = [...billingItems];
    // Ensure quantity is a non-negative integer
    const newQuantity = parseInt(quantity, 10);
    updatedItems[index].quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;
    setBillingItems(updatedItems);
  };

  const removeItem = (index) => {
    const updatedItems = [...billingItems];
    updatedItems.splice(index, 1);
    // Re-number items after removal
    const newItems = updatedItems.map((item, i) => ({
      ...item,
      itemNo: i + 1,
    }));
    setBillingItems(newItems);
    setNextItemNo(newItems.length + 1); // Update next item number
  };

  // --- Total Calculation ---

  useEffect(() => {
    const newTotal = billingItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + price * quantity;
    } , 0);
    setTotalAmount(newTotal);
  }, [billingItems]); // Recalculate whenever items change

  // --- Finalize, Print, PDF ---

  const handleFinalizeBill = async () => {
    if (billingItems.length === 0) {
        alert('Please add items to the bill before finalizing.');
        return;
    }
    if (!customerName || !billingDate) {
        alert('Please ensure Customer Name and Billing Date are filled.');
        return;
    }

    // Set flag to disable inputs during async operation
    setIsBillFinalized(true);
    setFinalizedBillId(null); // Clear previous finalized ID before attempting

    const billData = {
      customerName,
      customerPhoneNumber,
      billingDate,
      items: billingItems.map(item => ({
        productId: item.productId,
        nameDescription: item.nameDescription,
        price: item.price,
        quantity: item.quantity,
        partNumber: item.partNumber || '',
      })),
      totalAmount,
      isDraft: false, // Explicitly mark as not a draft
    };

    // Determine if we are finalizing a new bill or updating/finalizing an existing draft
    const isUpdatingDraft = !!currentDraftBillId;
    const apiUrl = isUpdatingDraft
      ? `http://localhost:5000/api/bills/${currentDraftBillId}/finalize` // Use the specific finalize endpoint
      : 'http://localhost:5000/api/bills'; // Use POST for new bills being finalized directly
    const method = isUpdatingDraft ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData), // Body needed for POST, backend finalize might ignore it but send anyway
      });

      if (response.ok) {
        const finalizedBill = await response.json(); // Get the finalized bill details
        alert('Bill finalized and saved successfully!');
        console.log('Finalized bill response:', finalizedBill);

        setFinalizedBillId(finalizedBill._id); // Store the ID of the *finalized* bill
        setCurrentDraftBillId(null); // Clear the draft ID as it's no longer a draft

        fetchDraftBills(); // Refresh the draft bills list (the finalized one should be gone)

        // Decide what to do after finalization:
        // Option 1: Keep the finalized bill displayed (current behavior, inputs disabled by isBillFinalized=true)
        // Option 2: Clear the form for a new bill
        // handleNewBill(); // Call this to clear the form immediately

      } else {
        const error = await response.json();
        alert(`Failed to finalize bill: ${error.message || response.statusText}`);
        setIsBillFinalized(false); // Re-enable form on failure
      }
    } catch (error) {
      console.error('Error finalizing bill:', error);
      alert('An error occurred while finalizing the bill. Check connection and try again.');
      setIsBillFinalized(false); // Re-enable form on failure
    }
  };

  const handlePrintBill = () => {
      if (billingItems.length === 0) {
          alert("Cannot print an empty bill.");
          return;
      }
      // Add print-specific CSS classes or styles if needed before printing
      // e.g., document.body.classList.add('print-mode');
      window.print();
      // Remove print-specific classes after printing
      // e.g., document.body.classList.remove('print-mode');
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
  }; // End of handleSaveAsPDF

  // --- New Bill / Reset ---

  const handleNewBill = () => {
    setBillingItems([]);
    setTotalAmount(0);
    setCustomerName('');
    setCustomerPhoneNumber('');
    const today = new Date().toISOString().slice(0, 10);
    setBillingDate(today);
    setIsBillFinalized(false); // Enable form for new bill
    setNextItemNo(1);
    setSearchTerm('');
    setSuggestions([]);
    setSelectedProductIndex(-1);
    setCurrentDraftBillId(null); // Clear draft ID
    setFinalizedBillId(null);   // Clear finalized ID
    // Optionally: fetchDraftBills(); // If needed to reset list selection visually
  };


  // --- Render ---

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Billing System</h1>

      {/* Customer Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded shadow-sm bg-white">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name:</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer name"
            disabled={isBillFinalized} // Disable if bill is finalized
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone:</label>
          <input
            type="text"
            value={customerPhoneNumber}
            onChange={(e) => setCustomerPhoneNumber(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer phone"
            disabled={isBillFinalized}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Billing Date:</label>
          <input
            type="date"
            value={billingDate}
            onChange={(e) => setBillingDate(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isBillFinalized}
          />
        </div>
      </div>

      {/* Action Buttons */}
       <div className="flex flex-wrap gap-2 mb-6">
         <button
           className={`py-2 px-4 rounded text-white font-semibold shadow ${isBillFinalized ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
           onClick={addItem}
           disabled={isBillFinalized}
         >
           Add Item
         </button>
         <button
           className={`py-2 px-4 rounded text-white font-semibold shadow ${isBillFinalized || billingItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
           onClick={saveDraftBill}
           disabled={isBillFinalized || billingItems.length === 0} // Disable if finalized or no items
         >
           {currentDraftBillId ? 'Update Draft' : 'Save Draft'}
         </button>
       </div>

      {/* Billing Items Table */}
      {billingItems.length > 0 && (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300 shadow-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">No.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300 w-2/5">Product Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Price</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Quantity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Total</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 border border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300 align-top">{item.itemNo}</td>
                  <td className="px-4 py-2 border border-gray-300 relative align-top">
                    <textarea
                      value={item.nameDescription}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      placeholder="Search or enter product details"
                      className="w-full py-1 px-2 border border-gray-300 rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      rows="3"
                      disabled={isBillFinalized}
                    />
                    {/* Suggestions Dropdown */}
                    {selectedProductIndex === index && suggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                        {suggestions.map((product) => (
                          <li
                            key={product._id}
                            onClick={() => handleSuggestionClick(index, product)}
                            className="p-2 text-sm cursor-pointer hover:bg-indigo-100"
                          >
                            {`${product.name} ${product.brand || ''} ${product.model || ''} ${product.partNumber ? '(PN:'+product.partNumber+')' : ''}`}
                            <span className="text-xs text-gray-500 block">{product.description || ''} - ₹{product.price}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 align-top">₹{item.price?.toFixed(2) || '0.00'}</td>
                  <td className="px-4 py-2 border border-gray-300 align-top">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      className="w-16 py-1 px-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min="0"
                      disabled={isBillFinalized}
                    />
                  </td>
                  <td className="px-4 py-2 border border-gray-300 align-top">₹{(item.price * item.quantity).toFixed(2)}</td>
                  <td className="px-4 py-2 border border-gray-300 text-center align-top">
                    <button
                      onClick={() => removeItem(index)}
                      className={`text-red-500 hover:text-red-700 ${isBillFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={isBillFinalized}
                      title="Remove Item"
                    >
                      {/* Simple X icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 text-right">
            <span className="text-xl font-bold text-gray-800">Total Amount: ₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Final Actions */}
      <div className="flex flex-wrap gap-2 mt-6 border-t pt-4">
         <button
           className={`py-2 px-4 rounded text-white font-semibold shadow ${isBillFinalized || billingItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
           onClick={handleFinalizeBill}
           disabled={isBillFinalized || billingItems.length === 0} // Disable if already finalized or no items
         >
           Finalize Bill
         </button>
         <button
           className={`py-2 px-4 rounded text-white font-semibold shadow ${billingItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-yellow-500 hover:bg-yellow-600'}`}
           onClick={handlePrintBill}
           disabled={billingItems.length === 0} // Disable only if no items
         >
           Print Bill
         </button>
         <button
           className={`py-2 px-4 rounded text-white font-semibold shadow ${billingItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
           onClick={handleSaveAsPDF}
           disabled={billingItems.length === 0} // Disable only if no items
         >
           Save as PDF
         </button>
          <button
           className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded font-semibold shadow"
           onClick={handleNewBill}
           // Generally, New Bill button should always be enabled
         >
           New Bill
         </button>
      </div>

        {/* Saved Draft Bills Section */}
        <div className="mt-10 border-t pt-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">Saved Draft Bills</h2>
            {draftBillsList.length === 0 ? (
            <p className="text-gray-500 italic">No draft bills found.</p>
            ) : (
            <ul className="space-y-3">
                {draftBillsList.map((bill) => (
                <li key={bill._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded shadow-sm bg-white hover:bg-gray-50 transition duration-150">
                    <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-800">
                        {bill.customerName || 'Unnamed Customer'} - <span className="font-bold">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        {bill.billingDate ? new Date(bill.billingDate).toLocaleDateString() : 'No Date'} | Phone: {bill.customerPhoneNumber || 'N/A'} | ID: {bill._id}
                    </p>
                    </div>
                    <button
                    onClick={() => loadDraftBill(bill._id)}
                    className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm font-medium shadow transition duration-150 ${isBillFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isBillFinalized} // Prevent loading while viewing finalized bill
                    >
                    Load Draft
                    </button>
                </li>
                ))}
            </ul>
            )}
        </div>

    </div> // End main container div
  );
};

export default Billing;