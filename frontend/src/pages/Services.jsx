import React, { useState } from 'react';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handlePayment = () => {
    // Simulate a payment process
    setPaymentStatus('Payment Successful!');
  };

  return (
    <div>
      <h1>Payment</h1>
      <div>
        <label>
          Payment Method:
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="credit">Credit Card</option>
            <option value="paypal">PayPal</option>
            <option value="cash">Cash on Delivery</option>
          </select>
        </label>
      </div>
      <button onClick={handlePayment}>Pay Now</button>
      {paymentStatus && <p>{paymentStatus}</p>}
    </div>
  );
}

export default Payment;
