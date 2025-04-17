import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-semibold mb-4">Welcome to Our Bike and Scooter Shop</h2>
      <p className="text-lg text-gray-700 mb-6">
        Explore our wide range of high-quality bikes and scooters for all your needs.
        Whether you're commuting, hitting the trails, or just cruising around, we've got you covered.
      </p>
      <div className="flex justify-center space-x-4">
        <Link to="/inventory" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full">
          View Inventory
        </Link>
        <Link to="/services" className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full">
          Our Services
        </Link>
        <Link to="/billing" className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-full">
          Billing & Payments
        </Link>
      </div>
      <div className="mt-12">
        <h3 className="text-2xl font-semibold mb-2">Featured Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <img src="https://via.placeholder.com/300/007bff/ffffff?Text=Bike%201" alt="Bike 1" className="w-full h-48 object-cover rounded-md mb-4" />
            <h4 className="text-xl font-semibold mb-2">Awesome Bike Model A</h4>
            <p className="text-gray-600">$499.99</p>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">View Details</button>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <img src="https://via.placeholder.com/300/28a745/ffffff?Text=Scooter%201" alt="Scooter 1" className="w-full h-48 object-cover rounded-md mb-4" />
            <h4 className="text-xl font-semibold mb-2">Electric Scooter X</h4>
            <p className="text-gray-600">$349.99</p>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4">View Details</button>
          </div>
          {/* Add more featured products here */}
        </div>
      </div>
    </div>
  );
};

export default Home;