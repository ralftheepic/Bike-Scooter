import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="text-center py-10"> {/* Added overall vertical padding */}
      <h2 className="text-3xl font-semibold mb-6">Welcome to Our Bike and Scooter Shop</h2> {/* Increased margin below heading */}
      <p className="text-lg text-gray-700 mb-8 leading-relaxed"> {/* Increased margin and line height for paragraph */}
        Explore our wide range of high-quality bikes and scooters for all your needs.
        Whether you're commuting, hitting the trails, or just cruising around, we've got you covered.
      </p>
      <div className="mt-16"> {/* Increased margin above featured products */}
        <h3 className="text-2xl font-semibold mb-4">Featured Products</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6"> {/* Increased vertical and horizontal gap */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <img src="https://via.placeholder.com/300/007bff/ffffff?Text=Bike%201" alt="Bike 1" className="w-full h-48 object-cover rounded-md mb-4 **max-w-full**" />
            <h4 className="text-xl font-semibold mb-2">Awesome Bike Model A</h4>
            <p className="text-gray-600 mb-3">$499.99</p> {/* Added margin below price */}
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2 shadow-sm">View Details</button> {/* Added margin and subtle shadow */}
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <img src="https://via.placeholder.com/300/28a745/ffffff?Text=Scooter%201" alt="Scooter 1" className="w-full h-48 object-cover rounded-md mb-4 **max-w-full**" />
            <h4 className="text-xl font-semibold mb-2">Electric Scooter X</h4>
            <p className="text-gray-600 mb-3">$349.99</p> {/* Added margin below price */}
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-2 shadow-sm">View Details</button> {/* Added margin and subtle shadow */}
          </div>
          {/* Add more featured products here */}
        </div>
      </div>
    </div>
  );
};

export default Home;