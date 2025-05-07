import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';


const Sales = () => {

  const [activeSalesSection, setActiveSalesSection] = useState('buy'); // 'buy', 'sell', or 'dashboard'


  const [bulkOrders, setBulkOrders] = useState([]);
  const [individualBills, setIndividualBills] = useState([]);

  // Loading States
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(true);
  const [loadingIndividualBills, setLoadingIndividualBills] = useState(true);


  // Error States
  const [errorBulkOrders, setErrorBulkOrders] = useState(null);
  const [errorIndividualBills, setErrorIndividualBills] = useState(null);


  // Filter States for "Buy" (Bulk Orders)
  const [filterBuyDistributor, setFilterBuyDistributor] = useState('');
  const [filterBuyDate, setFilterBuyDate] = useState('');

  // Filter States for "Sell" (Individual Bills)
  const [filterSellCustomerName, setFilterSellCustomerName] = useState('');
  const [filterSellCustomerNumber, setFilterSellCustomerNumber] = useState('');
  const [filterSellDate, setFilterSellDate] = useState('');
  const [filterSellPriceGreaterThan, setFilterSellPriceGreaterThan] = useState('');
  const [filterSellPriceLessThan, setFilterSellPriceLessThan] = useState('');


  useEffect(() => {
    const fetchBulkOrders = async () => {
      setLoadingBulkOrders(true);
      setErrorBulkOrders(null);
      try {
        const response = await fetch('http://localhost:5000/api/bulk-orders');
        if (!response.ok) {
          const errorDetails = await response.json().catch(() => response.text());
          throw new Error(
            `HTTP error! status: ${response.status} - ${
              typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'
            }`
          );
        }
        const data = await response.json(); // Directly use the data processed by the backend
        // --- END ---

        console.log("Fetched and Processed Bulk Orders (from Backend):", data); // Log the data structure received

        setBulkOrders(data);
      } catch (error) {
        console.error("Error fetching bulk orders:", error);
        setErrorBulkOrders('Failed to load bulk orders. Please try again.');
      } finally {
        setLoadingBulkOrders(false);
      }
    };

    fetchBulkOrders();
  }, []);


  useEffect(() => {
    const fetchIndividualBills = async () => {
      setLoadingIndividualBills(true);
      setErrorIndividualBills(null);
      try {
        const response = await fetch('http://localhost:5000/api/bills/finalized');
        if (!response.ok) {
             const errorDetails = await response.json().catch(() => response.text());
             throw new Error(`HTTP error! status: ${response.status} - ${typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'}`);
        }
        const data = await response.json();
        setIndividualBills(data);
        console.log("Fetched Individual Bills:", data);
      } catch (error) {
        console.error("Error fetching individual bills:", error);
        setErrorIndividualBills('Failed to load individual bills. Please try again.');
      } finally {
        setLoadingIndividualBills(false);
      }
    };
    fetchIndividualBills();
  }, []);


  // --- Filtering Logic ---

  // Filter Bulk Orders based on filter state
  const filteredBulkOrders = bulkOrders.filter(order => {
      const matchesDistributor = order.distributorSource
        ? order.distributorSource.toLowerCase().includes(filterBuyDistributor.toLowerCase())
        : true;

      const orderDate = order.receiptDate ? new Date(order.receiptDate).toISOString().slice(0, 10) : '';
      const matchesDate = filterBuyDate ? orderDate === filterBuyDate : true;

      return matchesDistributor && matchesDate;
  });


  // Filter Individual Bills based on filter state
  const filteredIndividualBills = individualBills.filter(bill => {
      const matchesName = bill.customerName
        ? bill.customerName.toLowerCase().includes(filterSellCustomerName.toLowerCase())
        : true;

      const matchesNumber = bill.customerPhoneNumber
        ? bill.customerPhoneNumber.includes(filterSellCustomerNumber)
        : true;

      const billDate = bill.billingDate ? new Date(bill.billingDate).toISOString().slice(0, 10) : '';
      const matchesDate = filterSellDate ? billDate === filterSellDate : true;

      const billTotalAmount = bill.totalAmount || 0;
      const filterSellGT = parseFloat(filterSellPriceGreaterThan);
      const filterSellLT = parseFloat(filterSellPriceLessThan);

      const matchesPriceGreaterThan = filterSellPriceGreaterThan === '' || isNaN(filterSellGT) || billTotalAmount >= filterSellGT;
      const matchesPriceLessThan = filterSellPriceLessThan === '' || isNaN(filterSellLT) || billTotalAmount <= filterSellLT; // Corrected variable name here


      return matchesName && matchesNumber && matchesDate && matchesPriceGreaterThan && matchesPriceLessThan;
  });

  // --- Clear Filters ---

    const clearBuyFilters = () => {
        setFilterBuyDistributor('');
        setFilterBuyDate('');
    };

    const clearSellFilters = () => {
        setFilterSellCustomerName('');
        setFilterSellCustomerNumber('');
        setFilterSellDate('');
        setFilterSellPriceGreaterThan('');
        setFilterSellPriceLessThan('');
    };


  // --- Render ---

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Sales & Performance</h2>

      {/* Toggle Buttons - Now includes Dashboard */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded-md transition-all duration-200 ${activeSalesSection === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setActiveSalesSection('buy')}
        >
          Buy (Bulk Orders)
        </button>
        <button
          className={`px-6 py-2 rounded-md transition-all duration-200 ${activeSalesSection === 'sell' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setActiveSalesSection('sell')}
        >
          Sell (Individual Bills)
        </button>
         {/* === Dashboard Button Added Here === */}
         <button
          className={`px-6 py-2 rounded-md transition-all duration-200 ${activeSalesSection === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setActiveSalesSection('dashboard')}
        >
          Dashboard (KPIs)
        </button>
      </div>

      {/* === Conditional Rendering Based on activeSalesSection === */}

      {/* Bulk Orders Section */}
      {activeSalesSection === 'buy' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Bulk Orders (Purchases)</h3>

           {/* Buy Filter Section */}
          <div className="mb-6 p-4 border rounded shadow-sm bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="filterBuyDistributor" className="block text-sm font-medium text-gray-700 mb-1">Filter by Distributor:</label>
                <input
                  id="filterBuyDistributor"
                  type="text"
                  value={filterBuyDistributor}
                  onChange={(e) => setFilterBuyDistributor(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter distributor name"
                />
              </div>
              <div>
                <label htmlFor="filterBuyDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Receipt Date:</label>
                <input
                  id="filterBuyDate"
                  type="date"
                  value={filterBuyDate}
                  onChange={(e) => setFilterBuyDate(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
               {/* Clear Filters Button for Buy */}
               <div className="flex items-end">
                  <button
                      onClick={clearBuyFilters}
                      className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                      Clear Filters
                  </button>
              </div>
          </div>


          {loadingBulkOrders ? (
              <p className="text-center text-gray-500">Loading bulk orders...</p>
          ) : errorBulkOrders ? (
              <p className="text-center text-red-500">Error: {errorBulkOrders}</p>
          ) : filteredBulkOrders.length > 0 ? (
            <div className="space-y-8">
              {filteredBulkOrders.map(order => (
                 <div key={order._id} className="border rounded-lg p-4 shadow bg-white">
                 <div className="flex flex-wrap justify-between text-sm text-gray-600 mb-2">
                    <span><strong>Order ID:</strong> {order._id}</span>
                    <span><strong>Date:</strong> {order.receiptDate ? new Date(order.receiptDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4"><strong>Distributor:</strong> {order.distributorSource || 'N/A'}</p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2">Part Number</th>
                          <th className="border px-4 py-2">Name</th>
                          <th className="border px-4 py-2">Brand</th>
                          <th className="border px-4 py-2">Model</th>
                          <th className="border px-4 py-2">Qty Received</th>
                          <th className="border px-4 py-2">Unit Purchase Price</th>
                          <th className="border px-4 py-2">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            {/* --- FIX: Access productDetails instead of product --- */}
                            <td className="border px-4 py-2">{item.productDetails?.partNo || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.productDetails?.name || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.productDetails?.brand || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.productDetails?.model || 'N/A'}</td>
                            {/* --- Keep quantityReceived and purchasePrice from the item itself --- */}
                            <td className="border px-4 py-2 text-right">{item.quantityReceived}</td>
                            <td className="border px-4 py-2 text-right">₹{item.purchasePrice?.toFixed(2) || '0.00'}</td>
                            {/* --- Access selling price from productDetails --- */}
                            <td className="border px-4 py-2 text-right">₹{item.productDetails?.price?.toFixed(2) || '0.00'}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={5} className="border px-4 py-2 text-right">Total Bill Amount:</td>
                          <td colSpan={2} className="border px-4 py-2 text-right">₹{order.totalBillAmount?.toFixed(2) || '0.00'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             (filterBuyDistributor || filterBuyDate) && !loadingBulkOrders && !errorBulkOrders && filteredBulkOrders.length === 0
             ? <p className="text-center text-gray-500">No bulk orders found matching filters.</p>
             : !loadingBulkOrders && !errorBulkOrders && bulkOrders.length === 0
                ? <p className="text-center text-gray-500">No bulk orders found.</p>
                : null
          )}
        </div>
      )}

      {/* Individual Bills Section */}
      {activeSalesSection === 'sell' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Individual Bills (Sales)</h3>

           {/* Sell Filter Section */}
          <div className="mb-6 p-4 border rounded shadow-sm bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filterSellCustomerName" className="block text-sm font-medium text-gray-700 mb-1">Filter by Customer Name:</label>
                <input
                  id="filterSellCustomerName"
                  type="text"
                  value={filterSellCustomerName}
                  onChange={(e) => setFilterSellCustomerName(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label htmlFor="filterSellCustomerNumber" className="block text-sm font-medium text-gray-700 mb-1">Filter by Phone Number:</label>
                <input
                  id="filterSellCustomerNumber"
                  type="text"
                  value={filterSellCustomerNumber}
                  onChange={(e) => setFilterSellCustomerNumber(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <label htmlFor="filterSellDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Billing Date:</label>
                <input
                  id="filterSellDate"
                  type="date"
                  value={filterSellDate}
                  onChange={(e) => setFilterSellDate(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
               {/* Amount Greater Than Filter for Sell */}
              <div>
                <label htmlFor="filterSellPriceGreaterThan" className="block text-sm font-medium text-gray-700 mb-1">Amount &ge;:</label>
                <input
                  id="filterSellPriceGreaterThan"
                  type="number"
                  value={filterSellPriceGreaterThan}
                  onChange={(e) => setFilterSellPriceGreaterThan(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Greater than or equal to"
                  step="0.01"
                />
              </div>
               {/* Amount Less Than Filter for Sell */}
              <div>
                <label htmlFor="filterSellPriceLessThan" className="block text-sm font-medium text-gray-700 mb-1">Amount &le;:</label>
                <input
                  id="filterSellPriceLessThan"
                  type="number"
                  value={filterSellPriceLessThan}
                  onChange={(e) => setFilterSellPriceLessThan(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Less than or equal to"
                  step="0.01"
                />
              </div>
               {/* Clear Filters Button for Sell */}
                <div className="flex items-end">
                   <button
                       onClick={clearSellFilters}
                       className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                   >
                       Clear Filters
                   </button>
               </div>
           </div>


          {loadingIndividualBills ? (
              <p className="text-center text-gray-500">Loading individual bills...</p>
          ) : errorIndividualBills ? (
              <p className="text-center text-red-500">Error: {errorIndividualBills}</p>
          ) : filteredIndividualBills.length > 0 ? (
            <ul className="space-y-4">
              {filteredIndividualBills.map(bill => (
                 <li key={bill._id} className="border rounded-lg p-4 shadow bg-white space-y-2">
                    <p><strong>Bill ID:</strong> {bill._id}</p>
                    <p><strong>Customer:</strong> {bill.customerName}</p>
                     <p><strong>Phone Number:</strong> {bill.customerPhoneNumber || 'N/A'}</p>
                     <p><strong>Billing Date:</strong> {bill.billingDate ? new Date(bill.billingDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Total:</strong> ₹{bill.totalAmount?.toFixed(2) || '0.00'}</p>

                    {/* Render items */}
                    <div className="overflow-x-auto mt-2">
                      <table className="min-w-full table-auto border text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border px-3 py-1">Part Number</th>
                            <th className="border px-3 py-1">Name</th>
                            <th className="border px-3 py-1">Brand</th>
                            <th className="border px-3 py-1">Model</th>
                            <th className="border px-3 py-1">Qty</th>
                            <th className="border px-3 py-1">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {/* --- Individual Bills use a different structure, keep this as is --- */}
                              <td className="border px-3 py-1">{item.product?.partNumber || 'N/A'}</td>
                              <td className="border px-3 py-1">{item.product?.name || 'N/A'}</td>
                              <td className="border px-3 py-1">{item.product?.brand || 'N/A'}</td>
                              <td className="border px-3 py-1">{item.product?.model || 'N/A'}</td>
                              <td className="border px-3 py-1 text-right">{item.quantity}</td>
                              <td className="border px-3 py-1 text-right">₹{item.price?.toFixed(2) || '0.00'}</td>
                          </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </li>
                ))}

            </ul>
          ) : (
            (filterSellCustomerName || filterSellCustomerNumber || filterSellDate || filterSellPriceGreaterThan || filterSellPriceLessThan) && !loadingIndividualBills && !errorIndividualBills && filteredIndividualBills.length === 0
            ? <p className="text-center text-gray-500">No individual bills found matching filters.</p>
            : !loadingIndividualBills && !errorIndividualBills && individualBills.length === 0
                ? <p className="text-center text-gray-500">No individual bills found.</p>
                : null
          )}
        </div>
      )}

        {/* === Dashboard Section (Renders the Dashboard Component) === */}
        {activeSalesSection === 'dashboard' && (
            // === Render the imported Dashboard component here ===
            <Dashboard />
        )}


    </div> // End main container div
  );
};

export default Sales;
