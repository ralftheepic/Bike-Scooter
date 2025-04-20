// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Payment from './pages/Payment';
import Services from './pages/Services';
import Sales from './pages/Sales';

// Define GS Caltex color palette as Tailwind-compatible classnames
const gsCaltexColors = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  darkGray: 'text-gray-700',
  lightGray: 'bg-gray-50',
  secondary: 'bg-blue-100',
  textSecondary: 'text-gray-600',
};

const App = () => {
  return (
    <Router>
      <div className={`min-h-screen font-sans ${gsCaltexColors.lightGray} text-gray-800 **overflow-x-hidden**`}> {/* Added overflow-x-hidden */}
        {/* Header */}
        <header className={`py-4 shadow-md ${gsCaltexColors.blue} text-white`}>
          <div className="container mx-auto px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Bike and Scooter Shop</h1>
            {/* You could add a logo here */}
          </div>
        </header>

        {/* Navbar */}
        <nav className={`py-2 shadow-sm ${gsCaltexColors.secondary} ${gsCaltexColors.darkGray}`}>
          <div className="container mx-auto px-6">
            <ul className="flex space-x-4 md:space-x-6 justify-center !flex">
              <li>
                <Link
                  to="/"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  {/* Subtle hover effect */}
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/inventory"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  Inventory
                </Link>
              </li>
              <li>
                <Link
                  to="/billing"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  Billing
                </Link>
              </li>
              <li>
                <Link
                  to="/sales"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  Sales
                </Link>
              </li>
              <li>
                <Link
                  to="/payment"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  Payment
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  className="inline-block text-lg text-gray-700 hover:bg-blue-200 rounded py-2 px-3 transition-colors no-underline"
                >
                  Services
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="container mx-auto py-8 px-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/services" element={<Services />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className={`py-4 mt-8 shadow-inner ${gsCaltexColors.blue} text-white ${gsCaltexColors.textSecondary}`}>
          <div className="container mx-auto px-6 text-center text-sm">
            <p>&copy; 2025 Bike and Scooter Shop. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;