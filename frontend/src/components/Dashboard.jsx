import React, { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);


const Dashboard = () => {
  const [monthlySales, setMonthlySales] = useState([]);
  const [weeklySales, setWeeklySales] = useState([]);
  const [dailySales, setDailySales] = useState([]); 
  const [monthlyPurchases, setMonthlyPurchases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          monthlySalesRes,
          weeklySalesRes,
          monthlyPurchasesRes,
        ] = await Promise.all([
        
            fetch('http://localhost:5000/api/reports/monthly-sales?months=12'),
        
            fetch('http://localhost:5000/api/reports/weekly-sales?weeks=10'),
           
            
            fetch('http://localhost:5000/api/reports/monthly-purchases?months=12'),
        ]);

        if (!monthlySalesRes.ok) {
             const errorDetails = await monthlySalesRes.json().catch(() => monthlySalesRes.text());
             throw new Error(`Failed to fetch monthly sales: ${monthlySalesRes.status} - ${typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'}`);
        }
        const monthlySalesData = await monthlySalesRes.json();
        setMonthlySales(monthlySalesData);
        console.log("Fetched Monthly Sales:", monthlySalesData);


        if (!weeklySalesRes.ok) {
             const errorDetails = await weeklySalesRes.json().catch(() => weeklySalesRes.text());
             throw new Error(`Failed to fetch weekly sales: ${weeklySalesRes.status} - ${typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'}`);
        }
        const weeklySalesData = await weeklySalesRes.json();
        setWeeklySales(weeklySalesData);
        console.log("Fetched Weekly Sales:", weeklySalesData);

        if (!monthlyPurchasesRes.ok) {
             const errorDetails = await monthlyPurchasesRes.json().catch(() => monthlyPurchasesRes.text());
             throw new Error(`Failed to fetch monthly purchases: ${monthlyPurchasesRes.status} - ${typeof errorDetails === 'string' ? errorDetails : errorDetails.message || 'Unknown error'}`);
        }
        const monthlyPurchasesData = await monthlyPurchasesRes.json();
        setMonthlyPurchases(monthlyPurchasesData);
        console.log("Fetched Monthly Purchases:", monthlyPurchasesData);


      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please check backend reports endpoints.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const monthlySalesChartData = {
      labels: monthlySales.map(item => item._id), 
      datasets: [
          {
              label: 'Monthly Sales Amount',
              data: monthlySales.map(item => item.total),
              backgroundColor: 'rgba(75, 192, 192, 0.6)', 
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
          },
      ],
  };

   const monthlyPurchasesChartData = {
      labels: monthlyPurchases.map(item => item._id), 
      datasets: [
          {
              label: 'Monthly Purchase Amount',
              data: monthlyPurchases.map(item => item.total),
              backgroundColor: 'rgba(255, 159, 64, 0.6)', 
              borderColor: 'rgba(255, 159, 64, 1)',
              borderWidth: 1,
          },
      ],
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Business Performance Dashboard (KPIs)</h2>
      {loading ? (
          <p className="text-center text-gray-500">Loading dashboard data...</p>
      ) : error ? (
          <p className="text-center text-red-600">Error: {error}</p>
      ) : (
           <div className="space-y-8">
                {monthlySales.length > 0 && (
                    <div className="bg-white p-4 rounded shadow">
                        <h4 className="text-lg font-semibold mb-2">Monthly Sales Overview</h4>
                        <p className="text-center text-gray-500 italic">
                            [Monthly Sales Chart Placeholder - Requires installing and using a charting library like Chart.js]
                            <br/>Sample Data Points: {monthlySales.map(item => `${item._id}: ₹${item.total?.toFixed(2) || '0.00'}`).join(', ')}
                        </p>
                    </div>
                )}

                {/* Example Chart Placeholder - Monthly Purchases */}
                 {monthlyPurchases.length > 0 && (
                    <div className="bg-white p-4 rounded shadow">
                        <h4 className="text-lg font-semibold mb-2">Monthly Purchase Overview</h4>
                        <p className="text-center text-gray-500 italic">
                            [Monthly Purchase Chart Placeholder - Requires installing and using a charting library like Chart.js]
                             <br/>Sample Data Points: {monthlyPurchases.map(item => `${item._id}: ₹${item.total?.toFixed(2) || '0.00'}`).join(', ')}
                        </p>
                    </div>
                )}

                {(weeklySales.length > 0 /* || dailySales.length > 0 */) && (
                     <div className="bg-white p-4 rounded shadow">
                        <h4 className="text-lg font-semibold mb-2">Weekly/Daily Sales Trend</h4>
                        <p className="text-center text-gray-500 italic">
                            [Weekly/Daily Sales Chart Placeholder - Requires installing and using a charting library like Chart.js]
                             <br/>Sample Weekly Data Points: {weeklySales.map(item => `${item._id}: ₹${item.total?.toFixed(2) || '0.00'}`).join(', ')}
                             {/* Add Sample Daily Data Points here if implemented */}
                        </p>
                     </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded shadow">
                    <div className="text-center p-4 bg-gray-100 rounded">
                        <h4 className="text-lg font-semibold">Total Sales (Last 30 Days)</h4>
                        {/* Fetch from a specific backend KPI endpoint or calculate from fetched data */}
                        <p className="text-2xl font-bold text-indigo-600">₹[Calculate or Fetch]</p>
                    </div>
                     <div className="text-center p-4 bg-gray-100 rounded">
                        <h4 className="text-lg font-semibold">Total Purchases (Last 30 Days)</h4>
                         {/* Fetch from a specific backend KPI endpoint or calculate from fetched data */}
                        <p className="text-2xl font-bold text-green-600">₹[Calculate or Fetch]</p>
                    </div>
                     <div className="text-center p-4 bg-gray-100 rounded">
                        <h4 className="text-lg font-semibold">Gross Profit (Estimate, Last Month)</h4>
                         {/* This is complex - simplify by (Sales - Purchases) for the period, or require specific backend calculation */}
                        <p className="text-2xl font-bold text-purple-600">₹[Calculation Needed]</p>
                    </div>
                </div>

            </div>
        )}
    </div>
  );
};

export default Dashboard;