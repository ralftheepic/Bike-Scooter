import mongoose from 'mongoose';

const billingItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    nameDescription: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
    // Optionally add partNumber here if you want it in the bill item subdocument
    partNumber: {
         type: String,
         required: false // Not all products may have a part number
    }
});

const billingSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true, // Keep required as it's needed for the bill document
        },
        customerPhoneNumber: {
            type: String,
            required: true, // Keep required as it's needed for the bill document and customer lookup
        },
        billingDate: {
            type: Date,
            required: true,
        },
        items: [billingItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        isDraft: {
            type: Boolean,
            default: true, // By default, create draft bills
        },

        // Add references to the Customer and Payment collections
        customerRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer', // Reference the 'Customer' model
            required: false, // Not required for drafts, only for finalized bills
        },
         paymentRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Payment', // Reference the 'Payment' model
            required: false, // Only set for finalized bills
        },
        finalizedAt: { // Add a timestamp for when the bill was finalized
             type: Date,
             required: false // Only set when isDraft becomes false
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true } // Keeps track of createdAt and updatedAt
);

const Billing = mongoose.model('Billing', billingSchema, 'billing'); // 'billing' is the collection name

export default Billing;