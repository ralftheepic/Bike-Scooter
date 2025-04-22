import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true // Remove leading/trailing whitespace
    },
    phoneNumber: {
        type: String,
        required: true, // Assuming phone number is required for identifying customers
        unique: true, // Ensure phone numbers are unique
        sparse: true, // Allow null or undefined phone numbers if needed (though required: true makes this less likely for unique)
        trim: true
    },
    latestBillingDate: {
        type: Date,
        required: false // Not required initially, set on first bill finalization
    },
    // You can add other customer details here (e'g., address, email)
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const Customer = mongoose.model('Customer', customerSchema, 'customers'); // 'customers' is the collection name

export default Customer;