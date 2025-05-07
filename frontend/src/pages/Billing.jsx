import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Import the autotable plugin

// Assuming you have basic CSS or Tailwind configured for these classes

const Billing = () => {
  // --- State Management ---
  const [billingItems, setBillingItems] = useState([]);
  const [inventory, setInventory] = useState([]); // Stores fetched product data
  const [totalAmount, setTotalAmount] = useState(0);
  const [nextItemNo, setNextItemNo] = useState(1); // For numbering items in the UI table

  // For product search suggestions
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState(-1); // To track which item input is focused for suggestions

  // Customer and Bill Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [billingDate, setBillingDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Bill Status and IDs
  const [isBillFinalized, setIsBillFinalized] = useState(false); // Controls form input disability
  const [currentDraftBillId, setCurrentDraftBillId] = useState(null); // ID of the draft currently loaded/being worked on
  const [finalizedBillId, setFinalizedBillId] = useState(null); // ID of the bill *after* it has been successfully finalized

  // Add state for customerRef and paymentRef
  const [customerRefId, setCustomerRefId] = useState(null);
  const [paymentRefId, setPaymentRefId] = useState(null);


  // Draft Bills List
  const [draftBillsList, setDraftBillsList] = useState([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false); // Loading state for drafts list

  // --- Data Fetching ---

  // Fetch available products from inventory
  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      } else {
        console.error('Failed to fetch inventory. Status:', response.status);
        // Consider a more user-friendly error display
        alert('Failed to fetch inventory items.');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      alert('Error connecting to server to fetch inventory.');
    }
  };

  // Fetch list of saved draft bills
  const fetchDraftBills = async () => {
    setIsLoadingDrafts(true);
    try {
      // Assuming your backend endpoint GET /api/bills/drafts correctly filters for drafts
      const response = await fetch('http://localhost:5000/api/bills/drafts');
      if (response.ok) {
        const data = await response.json();
        setDraftBillsList(data);
      } else if (response.status === 404) {
        setDraftBillsList([]); // No drafts found is a valid state
        console.log('No draft bills found.');
      } else {
        console.error('Failed to fetch draft bills. Status:', response.status);
        // Consider a more user-friendly error display
        alert('Failed to fetch draft bills.');
      }
    } catch (error) {
      console.error('Error fetching draft bills:', error);
      alert('Error connecting to server to fetch draft bills.');
    } finally {
        setIsLoadingDrafts(false);
    }
  };

  // --- Initial Load Effect ---
  useEffect(() => {
    fetchInventory();
    fetchDraftBills();
    // Set default billing date to today
    const today = new Date().toISOString().slice(0, 10);
    setBillingDate(today);
  }, []); // Empty dependency array means this runs once on component mount

  // --- Draft Bill Handling ---

  // Save or update the current bill as a draft
  const saveDraftBill = async () => {
    if (!customerName && !customerPhoneNumber) {
      alert('Please enter Customer Name or Phone Number to save a draft.');
      return;
    }
    if (billingItems.length === 0) {
      alert('Please add items before saving a draft.');
      return;
    }

    const billData = {
      customerName,
      customerPhoneNumber,
      billingDate, // Ensure date format is handled correctly by backend
      items: billingItems.map(item => ({
        // Ensure these fields match your billingItemSchema
        productId: item.productId, // This should be the MongoDB ObjectId from the product
        nameDescription: item.nameDescription,
        price: parseFloat(item.price), // Ensure price is a number
        quantity: parseInt(item.quantity, 10), // Ensure quantity is an integer
        partNumber: item.partNumber || '', // Include partNumber
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)), // Ensure totalAmount is a number
      isDraft: true, // Always true when saving a draft
    };

    let apiUrl;
    let method;

    if (currentDraftBillId) {
      // If we are working on an existing draft, update it
      apiUrl = `http://localhost:5000/api/bills/${currentDraftBillId}`;
      method = 'PUT';
    } else {
      // If it's a new bill, save it as a new draft
      apiUrl = 'http://localhost:5000/api/bills'; // Use POST for creating new bills/drafts
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
        alert(`Draft bill ${method === 'POST' ? 'saved' : 'updated'} successfully!`);
        console.log('Saved/Updated Draft Bill:', savedBill);
        setCurrentDraftBillId(savedBill._id); // Keep track of the draft ID

        // If saving an existing draft, the backend might return customerRef if already linked
        setCustomerRefId(savedBill.customerRef || null);
        setPaymentRefId(savedBill.paymentRef || null);


        fetchDraftBills(); // Refresh the list of drafts
      } else {
        // Attempt to parse JSON error response first
        const error = await response.json().catch(() => {
            // If JSON parsing fails, get the response text (likely HTML)
            return response.text().then(text => ({ message: `Server responded with status ${response.status}`, detail: text }));
        });
        console.error(`Failed to ${method === 'POST' ? 'save' : 'update'} draft bill:`, response.status, error);
        alert(`Failed to ${method === 'POST' ? 'save' : 'update'} draft bill: ${error.message || response.statusText}\nDetails: ${typeof error.detail === 'string' ? error.detail.substring(0, 200) + '...' : 'N/A'}`);
      }
    } catch (error) {
      console.error(`Error ${method === 'POST' ? 'save' : 'update'} draft bill:`, error);
      alert(`Error connecting to server to ${method === 'POST' ? 'save' : 'update'} draft bill.`);
    }
  };

  // Load an existing draft bill into the form
  const loadDraftBill = async (draftBillId) => {
    // Optionally confirm if the user wants to discard the current bill state
    if (billingItems.length > 0 && currentDraftBillId !== draftBillId) {
        if (!window.confirm('Loading a draft will clear the current bill. Are you sure?')) {
            return;
        }
    }

    // Reset state before loading to avoid mixing data
    handleNewBill(); // Clear the current form

    try {
      const response = await fetch(`http://localhost:5000/api/bills/${draftBillId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Draft bill loaded:', data);
        if (!data || !data.items || data.customerName === undefined) {
             alert('Invalid data received: Bill data incomplete.');
             // Decide if you clear the form or leave partial data
             handleNewBill(); // Clear form if data is bad
             fetchDraftBills(); // Refresh list in case status changed unexpectedly
             return;
        }

        // Populate state from loaded bill data
        setBillingItems(data.items.map((item, index) => ({
            ...item,
            itemNo: index + 1, // Assign UI item numbers
            // Ensure item properties are numbers, with fallbacks
            price: parseFloat(item.price || 0),
            quantity: parseInt(item.quantity, 10) || 1,
            partNumber: item.partNumber || '',
        })));
        setCustomerName(data.customerName || '');
        setCustomerPhoneNumber(data.customerPhoneNumber || '');
        setBillingDate(data.billingDate ? new Date(data.billingDate).toISOString().slice(0, 10) : '');
        setTotalAmount(data.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.quantity, 10) || 0), 0));

        // Set bill status and IDs
        setIsBillFinalized(!data.isDraft); // If not draft, it's finalized
        setFinalizedBillId(data.isDraft ? null : data._id); // Set finalized ID only if not a draft
        setCurrentDraftBillId(data.isDraft ? data._id : null); // Set draft ID only if it's a draft

        // Set customerRef and paymentRef if they exist in the loaded data
        setCustomerRefId(data.customerRef || null);
        setPaymentRefId(data.paymentRef || null);

        setNextItemNo(data.items.length + 1); // Set next item number correctly

      } else if (response.status === 404) {
        alert('Bill not found.');
        fetchDraftBills(); // Refresh list if bill was deleted externally
      }
      else {
         // Attempt to parse JSON error response first
        const error = await response.json().catch(() => {
            // If JSON parsing fails, get the response text (likely HTML)
            return response.text().then(text => ({ message: `Server responded with status ${response.status}`, detail: text }));
        });
        console.error('Failed to load bill:', response.status, error);
        alert(`Failed to load bill: ${error.message || response.statusText}\nDetails: ${typeof error.detail === 'string' ? error.detail.substring(0, 200) + '...' : 'N/A'}`);
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      alert('Error connecting to server to load bill.');
    }
  };

  // Delete a draft bill
  const handleDeleteDraft = async (draftBillId) => {
    if (window.confirm('Are you sure you want to delete this draft bill? This cannot be undone.')) {
      try {
        const response = await fetch(`http://localhost:5000/api/bills/${draftBillId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('Draft bill deleted successfully!');
          console.log('Draft bill deleted:', draftBillId);
          // If the deleted draft was the one currently loaded, clear the form
          if (currentDraftBillId === draftBillId) {
            handleNewBill(); // This also clears customerRefId and paymentRefId
          }
          fetchDraftBills(); // Refresh the list of drafts
        } else if (response.status === 404) {
          alert('Draft bill not found.');
          fetchDraftBills(); // Refresh list if already deleted
        } else {
           // Attempt to parse JSON error response first
          const error = await response.json().catch(() => {
              // If JSON parsing fails, get the response text (likely HTML)
              return response.text().then(text => ({ message: `Server responded with status ${response.status}`, detail: text }));
          });
          console.error('Failed to delete draft bill:', response.status, error);
          alert(`Failed to delete draft bill: ${error.message || response.statusText}\nDetails: ${typeof error.detail === 'string' ? error.detail.substring(0, 200) + '...' : 'N/A'}`);
        }
      } catch (error) {
        console.error('Error deleting draft bill:', error);
        alert('Error connecting to server to delete draft bill.');
      }
    }
  };

  const addItem = () => {
    if (isBillFinalized) return;

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
    if (isBillFinalized) return;

    const updatedItems = [...billingItems];
    updatedItems[index].nameDescription = value;
    updatedItems[index].productId = '';
    setBillingItems(updatedItems);
    setSearchTerm(value);
    setSelectedProductIndex(index);
    console.log("Inventory (for debugging):", inventory);
    if (value.length > 1) {
      const filteredSuggestions = inventory.filter((product) => {
          const searchString = `${product.name || ''} ${product.brand || ''} ${product.model || ''} ${product.partNo || ''} ${product.productId || ''} ${product.description || ''}`; 
           return searchString.toLowerCase().includes(value.toLowerCase());
      });
      console.log("Filtered Suggestions (for debugging):", filteredSuggestions);
      setSuggestions(filteredSuggestions.slice(0, 10));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (index, product) => {
    if (isBillFinalized) return;

    // Create a detailed description string
    const nameDescription = `${product.name || ''} ${product.brand ? `(${product.brand})` : ''} ${product.model ? `[${product.model}]` : ''} ${product.partNumber ? `(PN: ${product.partNumber})` : ''} ${product.description ? `- ${product.description}` : ''}`.trim();

    const updatedItems = billingItems.map((item, i) =>
      i === index
        ? {
            ...item,
            productId: product._id, 
            nameDescription: nameDescription,
            price: parseFloat(product.price || 0), 
            partNumber: product.partNumber || product.productId,
          }
        : item
    );
    setBillingItems(updatedItems);
    setSuggestions([]); 
    setSearchTerm(''); 
    setSelectedProductIndex(-1); 
  };

  const handleQuantityChange = (index, quantity) => {
    if (isBillFinalized) return;

    const updatedItems = [...billingItems];
    // Ensure quantity is a non-negative integer
    const newQuantity = parseInt(quantity, 10);
    updatedItems[index].quantity = isNaN(newQuantity) || newQuantity < 0 ? 0 : newQuantity;
    setBillingItems(updatedItems);
  };

    // Remove a billing item
  const removeItem = (index) => {
    if (isBillFinalized) return;

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

  useEffect(() => {
    const newTotal = billingItems.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + price * quantity;
    } , 0);
    setTotalAmount(newTotal);
  }, [billingItems]); // Dependency array: runs when billingItems state changes

    const handleFinalizeBill = async () => {
        if (billingItems.length === 0) {
            alert('Please add items to the bill before finalizing.');
            return;
        }
        if (!customerName || !billingDate) {
            alert('Please ensure Customer Name and Billing Date are filled.');
            return;
        }
         if (!window.confirm('Are you sure you want to finalize this bill? This action cannot be undone.')) {
                return;
         }
    
        // Set flag to disable inputs during async operation
        setIsBillFinalized(true); // Disable inputs immediately
        setFinalizedBillId(null); // Clear any previous finalized ID before attempting
         setCustomerRefId(null); // Clear refs before attempting to finalize
         setPaymentRefId(null);

    
        const billData = {
          customerName,
          customerPhoneNumber,
          billingDate, // Send billing date
          items: billingItems.map(item => ({
          product: item.productId, // Map productId to product field
          quantity: parseInt(item.quantity, 10),
          price: parseFloat(item.price),
          })),
          totalAmount: parseFloat(totalAmount.toFixed(2)), // Send calculated total
          isDraft: false, // Explicitly mark as not a draft
          paymentMethod: paymentMethod, 
        };
    
        // Determine the API endpoint and method based on whether it's a new bill or an existing draft
        const apiUrl = currentDraftBillId
          ? `http://localhost:5000/api/bills/${currentDraftBillId}/finalize` // Finalize an existing draft (PUT)
          : 'http://localhost:5000/api/bills'; // Finalize a brand new bill (POST to base path) // <-- Corrected for new bills
    
        const method = currentDraftBillId ? 'PUT' : 'POST'; // Use PUT for drafts, POST for new bills // <-- Corrected method
    
        try {
          const response = await fetch(apiUrl, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(billData), // Send the bill data to the backend
          });
    
          console.log("Finalize response received:", response); // Log the full response object
    
          // Read the response body as text FIRST (most robust for errors)
          let responseText = "Could not read response body."; // Default fallback
          try {
              responseText = await response.text();
              console.log("Finalize response body read as text:", responseText);
          } catch (readError) {
              console.error("Failed to read finalize response body as text initially:", readError);
          }
    
          let responseData = null;
          if (response.ok) {
              // If response is OK (2xx status), try to parse the text as JSON
              try {
                  responseData = JSON.parse(responseText);
                  console.log("Finalize response body parsed as JSON:", responseData);
              } catch (parseError) {
                  console.error("Failed to parse successful response text as JSON:", parseError, responseText);
                  // Handle case where a 2xx response is not JSON as expected
                  alert(`Finalize successful but received unexpected non-JSON response.\nDetails: ${responseText.substring(0, 200)}...`);
                  setIsBillFinalized(false); // Maybe re-enable or handle differently
              }
          } else {

              try {
                  responseData = JSON.parse(responseText);
                  console.log("Finalize error response body parsed as JSON:", responseData);
              } catch (parseError) {
                  // If it's not JSON (e.g., HTML from 404), responseData remains the text
                  console.warn("Failed to parse error response text as JSON:", parseError, responseText);
                  responseData = responseText; // Keep the text if JSON parsing failed
              }
          }
    
    
          if (response.ok) {
            const finalizedBill = responseData;
            if (!finalizedBill || !finalizedBill._id) {
                // Handle case where successful JSON is missing expected fields
                console.error("Successful finalize response JSON missing _id:", finalizedBill);
                alert('Finalize successful but server returned incomplete bill data.');
                setIsBillFinalized(false);
                return;
            }
    
            alert('Bill finalized and saved successfully!');
            console.log('Finalized bill response data:', finalizedBill);
    
            setFinalizedBillId(finalizedBill._id); // Store the ID of the *finalized* bill
            setCurrentDraftBillId(null); // Clear the draft ID as it's no longer a draft
            setCustomerRefId(finalizedBill.customerRef || null);
            setPaymentRefId(finalizedBill.paymentRef || null);
            fetchDraftBills(); // Refresh the draft bills list (the finalized one should be gone)
    
          } else {
            // Handle errors. responseData could be parsed JSON error object or raw text.
            const errorDetails = typeof responseData === 'object' && responseData !== null && responseData.message
                ? responseData.message
                : typeof responseData === 'string'
                    ? responseData.substring(0, 200) + '...'
                    : 'No readable response data'; // Fallback if responseData is not string or object with message
    
            console.error('Failed to finalize bill:', response.status, responseData);
            alert(`Failed to finalize bill: Server responded with status ${response.status}.\nDetails: ${errorDetails}`);
            setIsBillFinalized(false); // Re-enable form on failure
            setCustomerRefId(null); // Clear refs on finalize failure
            setPaymentRefId(null);
          }
        } catch (error) {
          console.error('Error finalizing bill (network or unexpected):', error);
          alert('An unexpected error occurred while finalizing the bill. Check connection and server status.');
          setIsBillFinalized(false);
          // Clear refs on finalize failure
          setCustomerRefId(null);
          setPaymentRefId(null);
        }
      };

  const handlePrintBill = () => {
      if (billingItems.length === 0) {
          alert("Cannot print an empty bill.");
          return;
      }
      window.print(); 
  };

  const handleSaveAsPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;
  
    // Title
    doc.setFontSize(20);
    doc.text('Shankar Automobile & Shankar Bike Garage', margin, y);
    y += 10;
  
    // Customer and Date Info
    doc.setFontSize(12);
    doc.text(`Customer Name: ${customerName}`, margin, y);
    y += 5;
    doc.text(`Billing Date: ${billingDate}`, margin, y);
    y += 10;
  
    // Header setup
    const headers = ['Item No.', 'Name & Description', 'Part No & Product ID', 'Price', 'Quantity', 'Total'];
    const colWidths = [15, 60, 50, 20, 20, 25];
    let x = margin;
  
    // Table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    headers.forEach((header, i) => {
      doc.text(header, x, y);
      x += colWidths[i];
    });
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 3;
  
    // Table body
    doc.setFont('helvetica', 'normal');
    billingItems.forEach((item) => {
      console.log(item );
      x = margin;
      doc.text(String(item.itemNo), x, y);
      x += colWidths[0];
  
      // Name & Description
      doc.text(item.nameDescription, x, y);
      x += colWidths[1];
  
      // Part No & Product ID
      const partNoAndId = item.partNumber
      ? item.partNumber
      : (item.productId || '');
      doc.text(partNoAndId, x, y);
      x += colWidths[2];
  
      // Price
      doc.text(item.price.toFixed(2), x, y);
      x += colWidths[3];
  
      // Quantity
      doc.text(String(item.quantity), x, y);
      x += colWidths[4];
  
      // Total
      doc.text((item.price * item.quantity).toFixed(2), x, y);
      y += 5;
    });
  
    // Bottom line
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  
    // Total Amount
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, margin, y);
  
    // Save PDF
    const fileName = `bill_${billingDate}_${customerName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };
  

  // --- New Bill / Reset ---

  // Reset all state to start a new bill
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
    setFinalizedBillId(null);   // Clear finalized ID
    setCustomerRefId(null); // Clear customer reference
    setPaymentRefId(null); // Clear payment reference
    setPaymentMethod('Cash');

    // Optionally: fetchDraftBills(); // If needed to visually deselect from the list
  };


  // --- Render ---

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Billing System</h1>

      {/* Customer Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border rounded shadow-sm bg-white">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Customer Name:</label>
          <input
            id="customerName"
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer name"
            disabled={isBillFinalized} // Disable if bill is finalized
          />
        </div>
        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">Customer Phone:</label>
          <input
            id="customerPhone"
            type="text"
            value={customerPhoneNumber}
            onChange={(e) => setCustomerPhoneNumber(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter customer phone"
            disabled={isBillFinalized}
          />
        </div>
        <div>
          <label htmlFor="billingDate" className="block text-sm font-medium text-gray-700 mb-1">Billing Date:</label>
          <input
            id="billingDate"
            type="date"
            value={billingDate}
            onChange={(e) => setBillingDate(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            disabled={isBillFinalized}
          />
        </div>
         {/* Payment Method Selection - INSERT THIS DIV */}
         <div>
           <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Payment Method:</label>
           <select
             id="paymentMethod"
             value={paymentMethod}
             onChange={(e) => setPaymentMethod(e.target.value)}
             className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             disabled={isBillFinalized}
           >
             <option value="Cash">Cash</option>
             <option value="UPI">UPI</option>
             {/* Add other payment methods here if needed */}
           </select>
         </div>
      </div> 

        {/* Display CustomerRef and PaymentRef if bill is finalized */}
        {isBillFinalized && (customerRefId || paymentRefId) && ( // Assuming state variables are customerRef and paymentRef holding the objects
            <div className="mb-6 p-4 border rounded shadow-sm bg-yellow-50">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Bill References:</h2>
                {/* Access the _id property of the populated customerRef object */}
                {customerRefId && customerRefId._id && <p className="text-sm text-gray-700"><strong>Customer ID:</strong> {customerRefId._id}</p>}
                 {/* Display the Bill ID (finalizedBillId) here as well */}
                 {finalizedBillId && <p className="text-sm text-gray-700"><strong>Bill ID:</strong> {finalizedBillId}</p>}
                {/* Access the _id property of the populated paymentRef object */}
                {paymentRefId && paymentRefId._id && <p className="text-sm text-gray-700"><strong>Payment ID:</strong> {paymentRefId._id}</p>}
            </div>
        )}


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
              {/* Removed whitespace/newlines between tr and th tags */}
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">No.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300 w-2/5">Product Description</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Part No.</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Price</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Quantity</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Total</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-600 border border-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {billingItems.map((item, index) => (
                // Removed whitespace/newlines between tr and td tags
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
                       onBlur={() => setTimeout(() => setSuggestions([]), 100)} // Hide suggestions on blur after a slight delay
                       onFocus={(e) => handleInputChange(index, e.target.value)} // Show suggestions again on focus
                    />
                    {/* Suggestions Dropdown */}
                    {selectedProductIndex === index && suggestions.length > 0 && (
                      <ul className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                        {suggestions.map((product) => (
                          <li
                            key={product._id}
                            // Use onMouseDown to ensure the click happens before onBlur
                            onMouseDown={() => handleSuggestionClick(index, product)}
                            className="p-2 text-sm cursor-pointer hover:bg-indigo-100"
                          >
                            {`${product.name || ''} ${product.brand || ''} ${product.model || ''} ${product.partNumber ? '(PN:'+product.partNumber+')' : ''}`}
                            <span className="text-xs text-gray-500 block">{product.description || ''} - ₹{product.price}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                   {/* Display Part Number */}
                   <td className="px-4 py-2 border border-gray-300 align-top text-sm">
                        {item.partNumber || '-'}
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
            {isLoadingDrafts ? (
                <p className="text-gray-500 italic">Loading drafts...</p>
            ) : draftBillsList.length === 0 ? (
            <p className="text-gray-500 italic">No draft bills found.</p>
            ) : (
            <ul className="space-y-3">
                {draftBillsList.map((bill) => (
                <li key={bill._id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between border p-4 rounded shadow-sm bg-white transition duration-150 ${currentDraftBillId === bill._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-800">
                        {bill.customerName || 'Unnamed Customer'} - <span className="font-bold">₹{bill.totalAmount?.toFixed(2) || '0.00'}</span>
                         {/* Display refs in draft list item if they exist (less likely unless a draft is loaded after being finalized and then somehow reverted) */}
                        {bill.customerRef && <span className="text-xs text-gray-500 ml-2">Cust: {bill.customerRef}</span>}
                        {bill.paymentRef && <span className="text-xs text-gray-500 ml-2">Pay: {bill.paymentRef}</span>}
                    </p>
                    <p className="text-sm text-gray-500">
                         {bill.billingDate ? new Date(bill.billingDate).toLocaleDateString() : 'No Date'} | Phone: {bill.customerPhoneNumber || 'N/A'} | ID: {bill._id}
                    </p>
                    </div>
                    <div className="flex gap-2"> {/* Container for Load and Delete buttons */}
                         <button
                           onClick={() => loadDraftBill(bill._id)}
                           className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-sm font-medium shadow transition duration-150 ${isBillFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                           disabled={isBillFinalized} // Prevent loading while viewing finalized bill
                         >
                           Load Draft
                         </button>
                         <button
                           onClick={() => handleDeleteDraft(bill._id)}
                            className={`bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded text-sm font-medium shadow transition duration-150 ${isBillFinalized ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={isBillFinalized} // Prevent deleting while viewing finalized bill
                         >
                           Delete Draft
                         </button>
                    </div>
                </li>
                ))}
            </ul>
            )}
        </div>

    </div> // End main container div
  );
};

export default Billing;