import React, { useState } from 'react';

const ProductScanner = () => {
  const [scannedId, setScannedId] = useState('');
  const [productDetails, setProductDetails] = useState(null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    if (scannedId) {
      try {
        const response = await fetch(`/api/scanner/${scannedId}`);
        if (response.ok) {
          const data = await response.json();
          setProductDetails(data);
          setError('');
        } else if (response.status === 404) {
          setProductDetails(null);
          setError('Product not found.');
        } else {
          setProductDetails(null);
          setError('Error fetching product details.');
        }
      } catch (err) {
        setProductDetails(null);
        setError('Network error.');
      }
    } else {
      setError('Please enter or scan a product ID.');
    }
  };

  return (
    <div>
      <h2>Product Scanner</h2>
      <input
        type="text"
        value={scannedId}
        onChange={(e) => setScannedId(e.target.value)}
        placeholder="Scan or enter Product ID"
      />
      <button onClick={handleScan}>Scan</button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {productDetails && (
        <div>
          <h3>Product Details:</h3>
          <p>Name: {productDetails.name}</p>
          <p>Brand: {productDetails.brand}</p>
          <p>Model: {productDetails.model}</p>
          <p>Price: ${productDetails.price}</p>
        </div>
      )}
    </div>
  );
};

export default ProductScanner;