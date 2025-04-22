import React, { useState, useEffect } from 'react';
// Assuming you have some basic CSS or Tailwind classes configured

const Payment = () => {
  // --- State Management ---
  const [payments, setPayments] = useState([]); // Stores fetched payment data
  const [loading, setLoading] = useState(true); // Loading state for data fetch
  const [error, setError] = useState(null); // Error state for data fetch

  // Filter State
  const [filterCustomerName, setFilterCustomerName] = useState('');
  const [filterCustomerNumber, setFilterCustomerNumber] = useState('');
  const [filterDate, setFilterDate] = useState(''); // Assuming date is stored as ISO string or Date object
  // New Amount Filter States
  const [filterAmountGreaterThan, setFilterAmountGreaterThan] = useState('');
  const [filterAmountLessThan, setFilterAmountLessThan] = useState('');

  // --- Data Fetching ---

  // Fetch all payment records from the backend
  const fetchPayments = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      // Assuming your backend has an endpoint like GET /api/payments
      const response = await fetch('http://localhost:5000/api/payments');

      if (!response.ok) {
        // Attempt to read error message from backend
        const errorDetails = await response.json().catch(() => response.text());
        throw new Error(`Failed to fetch payments: ${response.status} - ${typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'}`);
      }

      const data = await response.json();
      setPayments(data);
      console.log('Fetched payments:', data);

    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  // Fetch payments on component mount
  useEffect(() => {
    fetchPayments();
  }, []); // Empty dependency array means this runs once on mount

  // --- Filtering Logic ---

  // Filter payments based on state filter criteria
  const filteredPayments = payments.filter(payment => {
    const matchesName = payment.customerName
      ? payment.customerName.toLowerCase().includes(filterCustomerName.toLowerCase())
      : true; // If filter is empty, it matches

    const matchesNumber = payment.customerPhoneNumber
      ? payment.customerPhoneNumber.includes(filterCustomerNumber)
      : true; // If filter is empty, it matches

    // Convert payment date to ISO string (YYYY-MM-DD) for comparison
    const paymentDate = payment.billingDate ? new Date(payment.billingDate).toISOString().slice(0, 10) : '';
    const matchesDate = filterDate ? paymentDate === filterDate : true; // If no filter date, all dates match

    // Amount Filtering
    const paymentAmount = payment.totalAmount || 0; // Use 0 if totalAmount is missing
    const filterGT = parseFloat(filterAmountGreaterThan);
    const filterLT = parseFloat(filterAmountLessThan);

    const matchesAmountGreaterThan = filterAmountGreaterThan === '' || isNaN(filterGT) || paymentAmount >= filterGT;
    const matchesAmountLessThan = filterAmountLessThan === '' || isNaN(filterLT) || paymentAmount <= filterLT;

    // All conditions must be true to include the payment
    return matchesName && matchesNumber && matchesDate && matchesAmountGreaterThan && matchesAmountLessThan;
  });


  // --- Render ---

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-700">Payment Records</h1>

      {/* Filter Section */}
      {/* Expanded grid to potentially accommodate more filters per row */}
      <div className="mb-6 p-4 border rounded shadow-sm bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="filterCustomerName" className="block text-sm font-medium text-gray-700 mb-1">Filter by Customer Name:</label>
          <input
            id="filterCustomerName"
            type="text"
            value={filterCustomerName}
            onChange={(e) => setFilterCustomerName(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter name"
          />
        </div>
        <div>
          <label htmlFor="filterCustomerNumber" className="block text-sm font-medium text-gray-700 mb-1">Filter by Phone Number:</label>
          <input
            id="filterCustomerNumber"
            type="text"
            value={filterCustomerNumber}
            onChange={(e) => setFilterCustomerNumber(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter phone number"
          />
        </div>
        <div>
          <label htmlFor="filterDate" className="block text-sm font-medium text-gray-700 mb-1">Filter by Billing Date:</label>
          <input
            id="filterDate"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {/* Amount Greater Than Filter */}
         <div>
           <label htmlFor="filterAmountGreaterThan" className="block text-sm font-medium text-gray-700 mb-1">Amount &ge;:</label> {/* &ge; is HTML entity for >= */}
           <input
             id="filterAmountGreaterThan"
             type="number"
             value={filterAmountGreaterThan}
             onChange={(e) => setFilterAmountGreaterThan(e.target.value)}
             className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             placeholder="Greater than or equal to"
             step="0.01" // Allow decimal input
           />
         </div>
         {/* Amount Less Than Filter */}
         <div>
           <label htmlFor="filterAmountLessThan" className="block text-sm font-medium text-gray-700 mb-1">Amount &le;:</label> {/* &le; is HTML entity for <= */}
           <input
             id="filterAmountLessThan"
             type="number"
             value={filterAmountLessThan}
             onChange={(e) => setFilterAmountLessThan(e.target.value)}
             className="w-full py-2 px-3 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
             placeholder="Less than or equal to"
             step="0.01" // Allow decimal input
           />
         </div>
         {/* You might want to add a "Clear Filters" button here */}
          <div className="flex items-end"> {/* Align clear button at the bottom */}
             <button
                 onClick={() => {
                     setFilterCustomerName('');
                     setFilterCustomerNumber('');
                     setFilterDate('');
                     setFilterAmountGreaterThan('');
                     setFilterAmountLessThan('');
                 }}
                 className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded font-semibold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
             >
                 Clear Filters
             </button>
         </div>
      </div>


      {/* Payment List/Table */}
      {loading ? (
        <p className="text-center text-gray-500">Loading payment records...</p>
      ) : error ? (
        <p className="text-center text-red-600">Error: {error}</p>
      ) : filteredPayments.length === 0 ? (
        <p className="text-center text-gray-500">No payment records found matching filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse border border-gray-300 shadow-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Customer Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Phone Number</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Amount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 border border-gray-300">Method</th>
                 {/* Add more headers if you store transaction IDs, etc. */}
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(payment => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300 text-sm">
                    {payment.billingDate ? new Date(payment.billingDate).toLocaleDateString() : 'N/A'}
                   </td> {/* Display billing date */}
                  <td className="px-4 py-2 border border-gray-300 text-sm">{payment.customerName}</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">{payment.customerPhoneNumber}</td>
                  <td className="px-4 py-2 border border-gray-300 text-sm">₹{payment.totalAmount?.toFixed(2) || '0.00'}</td> {/* Display total amount */}
                  <td className="px-4 py-2 border border-gray-300 text-sm">{payment.paymentMethod}</td>
                   {/* Add more data cells here */}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Payment;