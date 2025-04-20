import React, { useState, useEffect } from 'react';

const Sales = () => {
  const [activeSalesSection, setActiveSalesSection] = useState('buy');
  const [bulkOrders, setBulkOrders] = useState([]);
  const [individualBills, setIndividualBills] = useState([]);
  const [loadingBulkOrders, setLoadingBulkOrders] = useState(true);
  const [loadingIndividualBills, setLoadingIndividualBills] = useState(true);
  const [errorBulkOrders, setErrorBulkOrders] = useState(null);
  const [errorIndividualBills, setErrorIndividualBills] = useState(null);

  useEffect(() => {
    const fetchBulkOrders = async () => {
      setLoadingBulkOrders(true);
      setErrorBulkOrders(null);
      try {
        const response = await fetch('http://localhost:5000/api/bulk-orders');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setBulkOrders(data);
      } catch (error) {
        setErrorBulkOrders(error.message);
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
        const response = await fetch('http://localhost:5000/api/bills');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setIndividualBills(data);
      } catch (error) {
        setErrorIndividualBills(error.message);
      } finally {
        setLoadingIndividualBills(false);
      }
    };
    fetchIndividualBills();
  }, []);

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Sales</h2>

      {/* Toggle Buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          className={`px-6 py-2 rounded-md transition-all duration-200 ${activeSalesSection === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setActiveSalesSection('buy')}
        >
          Buy
        </button>
        <button
          className={`px-6 py-2 rounded-md transition-all duration-200 ${activeSalesSection === 'sell' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          onClick={() => setActiveSalesSection('sell')}
        >
          Sell
        </button>
      </div>

      {/* Bulk Orders */}
      {activeSalesSection === 'buy' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Bulk Orders</h3>
          {loadingBulkOrders && <p>Loading bulk orders...</p>}
          {errorBulkOrders && <p className="text-red-500">Error: {errorBulkOrders}</p>}
          {!loadingBulkOrders && !errorBulkOrders && bulkOrders.length > 0 ? (
            <div className="space-y-8">
              {bulkOrders.map(order => (
                <div key={order._id} className="border rounded-lg p-4 shadow bg-white">
                  <div className="flex flex-wrap justify-between text-sm text-gray-600 mb-2">
                    <span><strong>Order ID:</strong> {order._id}</span>
                    <span><strong>Date:</strong> {order.receiptDate ? new Date(order.receiptDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-4 py-2">Part No</th>
                          <th className="border px-4 py-2">Name</th>
                          <th className="border px-4 py-2">Brand</th>
                          <th className="border px-4 py-2">Model</th>
                          <th className="border px-4 py-2">Qty</th>
                          <th className="border px-4 py-2">Unit Price</th>
                          <th className="border px-4 py-2">Selling Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="border px-4 py-2">{item.product?.partNo || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.product?.name || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.product?.brand || 'N/A'}</td>
                            <td className="border px-4 py-2">{item.product?.model || 'N/A'}</td>
                            <td className="border px-4 py-2 text-right">{item.quantityReceived}</td>
                            <td className="border px-4 py-2 text-right">₹{item.purchasePrice?.toFixed(2)}</td>
                            <td className="border px-4 py-2 text-right">₹{item.product?.price?.toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={4} className="border px-4 py-2">Distributor: {order.distributorSource}</td>
                          <td colSpan={3} className="border px-4 py-2 text-right">Total: ₹{order.totalBillAmount?.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No bulk orders found.</p>
          )}
        </div>
      )}

      {/* Individual Bills */}
      {activeSalesSection === 'sell' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Individual Bills</h3>
          {loadingIndividualBills && <p>Loading...</p>}
          {errorIndividualBills && <p className="text-red-500">Error: {errorIndividualBills}</p>}
          {!loadingIndividualBills && !errorIndividualBills && individualBills.length > 0 ? (
            <ul className="space-y-4">
              {individualBills.map(bill => (
                <li key={bill._id} className="border rounded-lg p-4 shadow bg-white">
                  <p><strong>Bill ID:</strong> {bill._id}</p>
                  <p><strong>Customer:</strong> {bill.customerName}</p>
                  <p><strong>Total:</strong> ₹{bill.totalAmount?.toFixed(2)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No individual bills found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Sales;
