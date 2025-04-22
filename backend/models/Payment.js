import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    billingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Billing', // Reference to the Billing model
        required: true,
        index: true // Index for faster lookups by billing ID
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer', // Reference to the Customer model
        required: true,
        index: true // Index for faster lookups by customer ID
    },
    customerName: {
        type: String,
        required: true // Denormalized
    },
    customerPhoneNumber: {
        type: String,
        required: true // Denormalized
    },
     billingDate: {
        type: Date,
        required: true // Denormalized from the bill
    },
    totalAmount: {
        type: Number,
        required: true // Amount paid is the total bill amount
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['UPI', 'Cash'] // Restrict to these two values
    },
    paymentDate: {
        type: Date,
        default: Date.now // Timestamp when the payment record is created (bill is finalized)
    },
    // You could add transaction IDs, reference numbers, etc. here
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Payment = mongoose.model('Payment', paymentSchema, 'payments'); // 'payments' is the collection name

export default Payment;