// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Payment from './pages/Payment';
import Services from './pages/Services';

const App = () => {
  return (
    <Router>
      <div className="bg-gs-light-gray min-h-screen font-sans"> {/* Use light gray as background */}
        <header className="bg-gs-blue text-white py-4 shadow-md"> {/* Use GS Caltex blue for header */}
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">Bike and Scooter Shop</h1>
          </div>
        </header>
        <nav className="bg-gs-yellow text-gs-dark-gray py-2 fixed top-0 left-0 right-0 z-10 shadow-sm"> {/* Use GS Caltex yellow for nav */}
          <div className="container mx-auto px-4">
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="hover:text-gs-dark-gray">Home</Link>
              </li>
              <li>
                <Link to="/inventory" className="hover:text-gs-dark-gray">Inventory</Link>
              </li>
              <li>
                <Link to="/billing" className="hover:text-gs-dark-gray">Billing</Link>
              </li>
              <li>
                <Link to="/payment" className="hover:text-gs-dark-gray">Payment</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-gs-dark-gray">Services</Link>
              </li>
            </ul>
          </div>
        </nav>
        <main className="container mx-auto py-8 px-4 mt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/services" element={<Services />} />
          </Routes>
        </main>
        <footer className="bg-gs-blue text-white py-4 mt-8 shadow-inner"> {/* Use GS Caltex blue for footer */}
          <div className="container mx-auto px-4 text-center">
            <p>&copy; 2025 Bike and Scooter Shop. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;