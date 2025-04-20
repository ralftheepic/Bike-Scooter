// Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Bike and Scooter Shop</h1>
        <div className="space-x-4 text-sm md:text-base">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/inventory" className="hover:underline">Inventory</Link>
          <Link to="/billing" className="hover:underline">Billing</Link>
          <Link to="/sales" className="hover:underline">Sales</Link>
          <Link to="/payment" className="hover:underline">Payment</Link>
          <Link to="/services" className="hover:underline">Services</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
