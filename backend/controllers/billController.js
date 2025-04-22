import Bill from '../models/Billing.js';
import DraftBill from '../models/DraftBills.js';
import Product from '../models/Product.js';
import Customer from '../models/Customers.js'; // Import Customer model
import Payment from '../models/Payment.js'; // Import Payment model
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Helper function to handle Customer lookup/creation and latest billing date update
const handleCustomerAndPaymentLinking = async (billData, savedBillId, session) => {
     logger.info(`Starting customer and payment linking for bill ID: ${savedBillId}`);
     const { customerName, customerPhoneNumber, billingDate, totalAmount, paymentMethod } = billData;

     let customer;
     let customerId = null;
     let paymentId = null;

     try {
         // Find or create the Customer
         customer = await Customer.findOne({ phoneNumber: customerPhoneNumber }).session(session);

         if (!customer) {
             logger.info(`Customer not found for phone number ${customerPhoneNumber}, creating new customer.`);
             customer = new Customer({
                 name: customerName,
                 phoneNumber: customerPhoneNumber,
                 latestBillingDate: billingDate, 
             });
             await customer.save({ session });
             logger.info(`New customer created with ID: ${customer._id}`);
         } else {
             logger.info(`Existing customer found with ID: ${customer._id} for phone number ${customerPhoneNumber}.`);
             // Update latest billing date only if the current bill's date is later
             if (!customer.latestBillingDate || new Date(billingDate) > new Date(customer.latestBillingDate)) {
                 customer.latestBillingDate = billingDate;
                 await customer.save({ session });
                 logger.info(`Updated latestBillingDate for customer ID: ${customer._id}`);
             } else {
                 logger.info(`Latest billing date for customer ID ${customer._id} is already more recent or same.`);
             }
         }
         customerId = customer._id;
         logger.info(`Customer handled. Customer ID: ${customerId}`);

         const payment = new Payment({
             billingId: savedBillId,
             customerId: customerId,
             customerName: customer.name, // Use name from the saved customer document
             customerPhoneNumber: customer.phoneNumber, // Use phone from the saved customer document
             billingDate: billingDate,
             totalAmount: totalAmount,
             paymentMethod: paymentMethod,
             paymentDate: new Date(), // Payment date is when the record is created (finalized)
         });
         await payment.save({ session });
         paymentId = payment._id;
         logger.info(`Payment record created with ID: ${paymentId} for bill ID: ${savedBillId}`);

         await Bill.findByIdAndUpdate(savedBillId, {
             customerRef: customerId,
             paymentRef: paymentId,
             finalizedAt: new Date(), 
         }, { session, new: true }); 


         logger.info(`Bill ID ${savedBillId} updated with customerRef ${customerId} and paymentRef ${paymentId}`);

         return { customerRef: customerId, paymentRef: paymentId }; // Return the IDs

     } catch (error) {
         logger.error(`Error during customer/payment linking for bill ID ${savedBillId}:`, error);
         throw error; // Re-throw the error to be caught by the main try-catch block
     }
};


// Handles saving new bills (both drafts and potentially finalized directly)
const saveBill = async (req, res) => {
  const { customerName, customerPhoneNumber, billingDate, items, totalAmount, isDraft, paymentMethod } = req.body; // Added paymentMethod here

  // Start a Mongoose session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      // --- Validation ---
      if (!customerName || !billingDate || !items || items.length === 0 || totalAmount === undefined) {
        logger.warn('Save Bill failed: Missing required fields or empty items.', { body: req.body });
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Missing required fields (Customer Name, Date, Items, Total Amount)' });
      }

      // Server-side calculation/validation of total amount
    const calculatedTotalAmount = items.reduce((acc, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return acc + price * quantity;
    }, 0);

    if (Math.abs(calculatedTotalAmount - totalAmount) > 0.01) {
       logger.warn(`Save Bill failed: Total amount mismatch. Calculated: ${calculatedTotalAmount}, Provided: ${totalAmount}`, { body: req.body });
       await session.abortTransaction();
       session.endSession();
      return res.status(400).json({ message: `Total amount (${totalAmount.toFixed(2)}) does not match the sum of item prices (${calculatedTotalAmount.toFixed(2)})` });
    }
    // --- End Validation ---


    const BillModel = isDraft ? DraftBill : Bill;
    const billStatus = isDraft ? 'draft' : 'finalized';

    const newBill = new BillModel({
      customerName,
      customerPhoneNumber,
      billingDate,
      items,
      totalAmount: calculatedTotalAmount,
      isDraft: isDraft,
      // customerRef, paymentRef, finalizedAt will be set if not draft
    });

    const savedBill = await newBill.save({ session });
    logger.info(`Successfully saved ${billStatus} bill draft with ID: ${savedBill._id}`); // Changed log message

    // If saving directly as finalized, perform linking and stock update
    if (!savedBill.isDraft) {
        logger.info(`Processing direct finalization for bill ID: ${savedBill._id}`);
        try {
            const { customerRef, paymentRef } = await handleCustomerAndPaymentLinking({ ...req.body, totalAmount: calculatedTotalAmount }, savedBill._id, session);

            // Update the originally saved bill object in memory to include the refs before sending back
            savedBill.customerRef = customerRef;
            savedBill.paymentRef = paymentRef;
            savedBill.finalizedAt = new Date();


            // --- Stock Update ---
            logger.info(`Updating stock for directly finalized bill ID: ${savedBill._id}`);
            for (const item of savedBill.items) {
                const { productId, quantity } = item; // Use productId for reliable lookup

                if (!productId) {
                    logger.warn(`Stock Update (Direct Finalize): Missing productId for item in bill ${savedBill._id}. Skipping stock update for this item.`);
                    // Decide how to handle: maybe fail transaction? For now, log and continue item loop.
                    continue;
                }

                // Find and update product quantity within the session
                const product = await Product.findById(productId).session(session);
                if (product) {
                    if (product.quantity >= quantity) {
                        product.quantity -= Number(quantity);
                        await product.save({ session });
                        logger.info(`Stock Update (Direct Finalize): Decreased quantity for Product ID ${productId} by ${quantity}. Bill ${savedBill._id}`);
                    } else {
                        logger.error(`Stock Update (Direct Finalize): Insufficient stock for Product ID ${productId}. Requested: ${quantity}, Available: ${product.quantity}. Bill ${savedBill._id}`);
                        // CRITICAL: Insufficient stock should likely FAIL the transaction.
                        await session.abortTransaction();
                        session.endSession();
                        return res.status(400).json({ message: `Insufficient stock for product with ID ${productId}. Required: ${quantity}, Available: ${product.quantity}` });
                    }
                } else {
                    logger.warn(`Stock Update (Direct Finalize): Product not found for Product ID: ${productId}. Bill ${savedBill._id}`);
                    // CRITICAL: Product not found should likely FAIL the transaction.
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: `Product with ID ${productId} not found.` });
                }
            }
            logger.info(`Stock update completed for directly finalized bill ID: ${savedBill._id}`);
            // --- End Stock Update ---

        } catch(linkingStockError) {
            logger.error(`Linking/Stock Update Error (Direct Finalize) for bill ID ${savedBill._id}:`, linkingStockError);
            // Transaction is aborted by the helper function or stock update logic, just re-throw or handle gracefully
            await session.abortTransaction(); // Ensure session is aborted
            session.endSession();
            // If the error wasn't a stock/product validation error, return a generic 500
            const errorMessage = linkingStockError.message || 'An error occurred during finalization linking/stock update.';
            if (!res.headersSent) { // Avoid sending headers twice if a specific error like 400 was already sent
                return res.status(500).json({ message: 'Internal server error during direct bill finalization', error: errorMessage });
            } else {
                 return; // Headers already sent, just return
             }
        }
    }

    await session.commitTransaction();
    session.endSession();

    // Return the saved bill (with refs if finalized)
    res.status(201).json(savedBill);

  } catch (error) {
    logger.error('Error saving bill (caught after transaction attempt):', error);
    // Ensure session is ended if an error occurred before commit
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    if (!session.hasEnded) {
        session.endSession();
    }

    // Check for validation errors specifically
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error saving bill', error: error.message });
  }
};


// Get ALL Draft Bills
const getDraftBills = async (req, res) => {
  try {
    // Fetch only documents where isDraft is explicitly true from DraftBill collection
    const draftBills = await DraftBill.find({ isDraft: true }).sort({ createdAt: -1 }); // Sort by newest first

    // It's okay if no drafts are found, return empty array
    res.status(200).json(draftBills);

  } catch (error) {
    logger.error('Error fetching draft bills:', error);
    res.status(500).json({ message: 'Error fetching draft bills', error: error.message });
  }
};

// Get a SINGLE Draft Bill by ID
const getDraftBill = async (req, res) => {
  try {
    // Fetch from DraftBill collection
    const draftBill = await DraftBill.findById(req.params.id); // Find by ID in DraftBill collection

    if (!draftBill) {
      logger.warn(`Get Draft Bill: Draft bill not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Although fetching from DraftBill, we can double check isDraft if needed
    // if (!draftBill.isDraft) { /* handle if necessary */ }

    res.status(200).json(draftBill); // Return the draft bill
  } catch (error) {
    logger.error(`Error fetching draft bill with ID: ${req.params.id}:`, error);
    // Check for invalid ObjectId format
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Bill ID format' });
    }
    res.status(500).json({ message: 'Error fetching draft bill', error: error.message });
  }
};


// Finalize a specific DRAFT bill (move from DraftBill to Bill collection and add refs)
const finalizeBill = async (req, res) => {
  const draftBillId = req.params.id;
  const { paymentMethod } = req.body;

  // Start a Mongoose session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Attempting to finalize draft bill with ID: ${draftBillId}`);

    // 1. Find the draft bill within the session
    const draftBill = await DraftBill.findById(draftBillId).session(session);

    if (!draftBill) {
      logger.warn(`Finalize Bill: Draft bill not found with ID: ${draftBillId}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Double check if it's actually a draft
    if (!draftBill.isDraft) {
        logger.warn(`Finalize Bill: Attempted to finalize a bill that is not marked as draft. ID: ${draftBillId}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Bill is already finalized or not a draft.' });
    }

    logger.info(`Found Draft Bill to finalize: ${draftBillId}`);

    // 2. Create a new finalized bill in the 'Billing' collection
    const finalizedBill = new Bill({
      customerName: draftBill.customerName,
      customerPhoneNumber: draftBill.customerPhoneNumber,
      billingDate: draftBill.billingDate,
      items: draftBill.items, // Copy items directly
      totalAmount: draftBill.totalAmount,
      isDraft: false, // Mark as finalized
      // customerRef, paymentRef, finalizedAt will be set in linking step
      // originalDraftId: draftBill._id // Optional: Keep a reference to the original draft
    });

    // 3. Save the new finalized bill within the session
    const savedFinalizedBill = await finalizedBill.save({ session });
    logger.info(`Finalized bill saved successfully to Billing collection with new ID: ${savedFinalizedBill._id} (from draft ID: ${draftBillId})`);

    // 4. Handle Customer and Payment Linking within the session
    try {
         // Pass necessary data including paymentMethod to the helper
        await handleCustomerAndPaymentLinking({ ...draftBill.toObject(), paymentMethod: paymentMethod }, savedFinalizedBill._id, session);
        logger.info(`Customer and payment linking completed for finalized bill ID: ${savedFinalizedBill._id}`);

    } catch(linkingError) {
        logger.error(`Linking Error during finalization for bill ID ${savedFinalizedBill._id} (from draft ${draftBillId}):`, linkingError);
        // CRITICAL: Linking failed, abort the transaction.
        await session.abortTransaction();
        session.endSession();
        // Return an appropriate error response
        const errorMessage = linkingError.message || 'An error occurred during customer/payment linking.';
        return res.status(500).json({ message: 'Internal server error during bill finalization (linking)', error: errorMessage });
    }


    // 5. Update Stock (crucial step) within the session
    logger.info(`Updating stock for finalized bill ID: ${savedFinalizedBill._id}`);
    try {
        for (const item of savedFinalizedBill.items) {
            const { productId, quantity } = item; // Use productId for reliable lookup

            if (!productId) {
                 logger.warn(`Stock Update (Finalize): Missing productId for item in finalized bill ${savedFinalizedBill._id}. Skipping stock update for this item.`);
                continue; // Decide how to handle: maybe fail transaction? For now, log and continue item loop.
            }

            // Find and update product quantity within the session
            const product = await Product.findById(productId).session(session);
            if (product) {
                if (product.quantity >= quantity) {
                    product.quantity -= Number(quantity);
                    await product.save({ session });
                    logger.info(`Stock Update (Finalize): Decreased quantity for Product ID ${productId} by ${quantity}. Bill ${savedFinalizedBill._id}`);
                } else {
                    logger.error(`Stock Update (Finalize): Insufficient stock for Product ID ${productId}. Requested: ${quantity}, Available: ${product.quantity}. Bill ${savedFinalizedBill._id}`);
                    // CRITICAL: Insufficient stock should likely FAIL the transaction.
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({ message: `Insufficient stock for product with ID ${productId}. Required: ${quantity}, Available: ${product.quantity}` });
                }
            } else {
                logger.warn(`Stock Update (Finalize): Product not found for Product ID: ${productId}. Bill ${savedFinalizedBill._id}`);
                // CRITICAL: Product not found should likely FAIL the transaction.
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Product with ID ${productId} not found.` });
            }
        }
        logger.info(`Stock update processing completed for finalized bill ID: ${savedFinalizedBill._id}`);
    } catch(stockError) {
        logger.error(`Stock Update Error (Finalize) for bill ID ${savedFinalizedBill._id} (from draft ${draftBillId}):`, stockError);
        // Transaction is aborted by stock update logic, just re-throw or handle gracefully
        await session.abortTransaction(); // Ensure session is aborted
        session.endSession();
        // If the error wasn't a stock/product validation error, return a generic 500
        const errorMessage = stockError.message || 'An error occurred during stock update.';
         if (!res.headersSent) {
             return res.status(500).json({ message: 'Internal server error during bill finalization (stock update)', error: errorMessage });
         } else {
             return;
         }
    }
    // --- End Stock Update ---


    // 6. Delete the original draft bill *after* successful finalization, linking, & stock update
    const deletedDraftBill = await DraftBill.findByIdAndDelete(draftBillId, { session });

    if (deletedDraftBill) {
      logger.info(`Draft bill with ID: ${draftBillId} successfully deleted after finalization.`);
    } else {
      // This might happen if the deletion process is interrupted or ID was wrong, but we already found it earlier. Log warning.
      logger.warn(`Draft bill with ID: ${draftBillId} was not found during deletion step, though finalization proceeded.`);
    }

    // Commit the transaction if all steps were successful
    await session.commitTransaction();
    session.endSession();

    // 7. Return the newly created finalized bill (including the refs added by the helper)
     // We need to fetch the updated document to ensure refs are populated if needed,
     // or return the `savedFinalizedBill` after manually adding refs in memory
     // Let's fetch the fully updated document to be safe
     const finalBillToSend = await Bill.findById(savedFinalizedBill._id);


    res.status(201).json(finalBillToSend);

  } catch (error) {
    logger.error(`Error finalizing bill (caught after transaction attempt, Draft ID: ${draftBillId}):`, error);
    // Ensure session is ended if an error occurred before commit
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    if (!session.hasEnded) {
        session.endSession();
    }

    // Check for specific error types
     if (error.name === 'ValidationError') { // Handle validation errors on saving the final bill
        return res.status(400).json({ message: 'Validation Error on saving finalized bill', errors: error.errors });
    }
    if (error.kind === 'ObjectId') { // Handle invalid draftBillId format
        return res.status(400).json({ message: 'Invalid Draft Bill ID format' });
    }

    res.status(500).json({ message: 'Internal server error during bill finalization', error: error.message });
  }
};


// Update an existing DRAFT bill
const updateDraftBill = async (req, res) => {
  const draftBillId = req.params.id;
  const { customerName, customerPhoneNumber, billingDate, items, totalAmount } = req.body; // Removed paymentMethod as it's for finalization

  // Start a Mongoose session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();


  try {
    // Validation
    if (!customerName || !billingDate || !items || items.length === 0 || totalAmount === undefined) {
       logger.warn(`Update Draft Bill failed: Missing required fields. ID: ${draftBillId}`, { body: req.body });
       await session.abortTransaction();
       session.endSession();
      return res.status(400).json({ message: 'Missing required fields (Customer Name, Date, Items, Total Amount)' });
    }

     // Server-side calculation/validation of total amount
    const calculatedTotalAmount = items.reduce((acc, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return acc + price * quantity;
    }, 0);

    if (Math.abs(calculatedTotalAmount - totalAmount) > 0.01) {
       logger.warn(`Update Draft Bill failed: Total amount mismatch. ID: ${draftBillId}. Calculated: ${calculatedTotalAmount}, Provided: ${totalAmount}`, { body: req.body });
       await session.abortTransaction();
       session.endSession();
      return res.status(400).json({ message: `Total amount (${totalAmount.toFixed(2)}) does not match the sum of item prices (${calculatedTotalAmount.toFixed(2)})` });
    }

    // Find the draft bill within the session
    const draftBill = await DraftBill.findById(draftBillId).session(session);

    if (!draftBill) {
      logger.warn(`Update Draft Bill: Draft bill not found with ID: ${draftBillId}`);
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Ensure it's still a draft before updating
    if (!draftBill.isDraft) {
        logger.warn(`Update Draft Bill: Attempted to update a non-draft bill. ID: ${draftBillId}`);
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Cannot update a bill that is already finalized.' });
    }

    // Update the draft bill fields within the session
    draftBill.customerName = customerName;
    draftBill.customerPhoneNumber = customerPhoneNumber;
    draftBill.billingDate = billingDate;
    draftBill.items = items; // Overwrite items array
    draftBill.totalAmount = calculatedTotalAmount; // Use server-calculated total
    draftBill.updatedAt = Date.now(); // Manually update timestamp if schema timestamps are disabled

    const updatedBill = await draftBill.save({ session });
    logger.info(`Successfully updated draft bill with ID: ${updatedBill._id}`);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(updatedBill);

  } catch (error) {
    logger.error(`Error updating draft bill with ID: ${draftBillId} (caught after transaction attempt):`, error);
    // Ensure session is ended if an error occurred before commit
    if (session.inTransaction()) {
        await session.abortTransaction();
    }
    if (!session.hasEnded) {
        session.endSession();
    }

     if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
     if (error.kind === 'ObjectId') { // Handle invalid draftBillId format
        return res.status(400).json({ message: 'Invalid Draft Bill ID format' });
    }
    res.status(500).json({ message: 'Internal server error updating draft bill', error: error.message });
  }
};

// Add this in billController.js
const getFinalizedBills = async (req, res) => {
  logger.info("get all finalized bill");
  try {
    const finalizedBills = await Bill.find({ isDraft: false })
      .sort({ createdAt: -1 })
      .populate({
        path: 'items.productId',
        select: 'partNo name brand model fit', // Select the fields you need from the Product model
      });

    // Process the nameDescription if productId is not populated or doesn't have brand, model, fit
    const billsWithExtractedDetails = finalizedBills.map(bill => ({
      ...bill.toObject(),
      items: bill.items.map(item => {
        if (item.productId) {
          return {
            ...item.toObject(),
            product: {
              partNo: item.productId.partNo || 'N/A',
              name: item.productId.name || 'N/A',
              brand: item.productId.brand || 'N/A',
              model: item.productId.model || 'N/A',
              fit: item.productId.fit || 'N/A',
            },
          };
        } else if (item.nameDescription) {
          // Fallback to parsing nameDescription if productId is not populated
          const parts = item.nameDescription.match(/^(.+?)\s+\((.+?)\)\s+\[(.*?)\]\s+-\s+(.*)$/);
          const name = parts?.[1] || item.nameDescription || 'N/A';
          const brand = parts?.[2] || 'N/A';
          const model = parts?.[3] || 'N/A';
          const fit = parts?.[4] || 'N/A';
          return {
            ...item.toObject(),
            product: {
              partNo: 'N/A', // Or try to extract if possible from nameDescription
              name,
              brand,
              model,
              fit,
            },
          };
        } else {
          return {
            ...item.toObject(),
            product: {
              partNo: 'N/A',
              name: 'N/A',
              brand: 'N/A',
              model: 'N/A',
              fit: 'N/A',
            },
          };
        }
      }),
    }));

    res.status(200).json(billsWithExtractedDetails);
  } catch (error) {
    logger.error('Error fetching finalized bills:', error);
    res.status(500).json({ message: 'Error fetching finalized bills', error: error.message });
  }
};

// Get a single FINALIZED bill by ID
const getFinalizedBill = async (req, res) => {
    try {
        const billId = req.params.id;
        logger.info(`Workspaceing single finalized bill with ID: ${billId}`);

        const finalizedBill = await Bill.findOne({ _id: billId, isDraft: false })
             .populate({
                path: 'items.productId',
                select: 'partNumber name brand model description',
            })
            .populate('customerRef')
            .populate('paymentRef');


        if (!finalizedBill) {
            logger.warn(`Get Finalized Bill: Bill not found or not finalized with ID: ${billId}`);
            return res.status(404).json({ message: 'Finalized bill not found' });
        }

        res.status(200).json(finalizedBill.toObject());

    } catch (error) {
        logger.error(`Error fetching finalized bill with ID: ${req.params.id}:`, error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ message: 'Invalid Bill ID format' });
        }
        res.status(500).json({ message: 'Error fetching finalized bill', error: error.message });
    }
};


// Delete a bill (should likely only allow deleting drafts from frontend)
const deleteBill = async (req, res) => {
    try {
      const billId = req.params.id;

      logger.info(`Attempting to delete bill with ID: ${billId}`);

      // Ensure the ID is a valid Mongoose ObjectId
      if (!mongoose.Types.ObjectId.isValid(billId)) {
        logger.warn('Delete Bill failed: Invalid Bill ID format');
        return res.status(400).json({ message: 'Invalid Bill ID format' });
      }

      // Use findByIdAndDelete and check if it was a draft
      const deletedBill = await DraftBill.findOneAndDelete({ _id: billId, isDraft: true });

      logger.info('Result of findOneAndDelete:', deletedBill ? 'Found and Deleted' : 'Not Found or Not Draft');

      if (!deletedBill) {
        logger.warn(`Delete Bill: Draft bill not found or is not a draft with ID: ${billId}`);
        return res.status(404).json({ message: 'Draft bill not found or is not a draft' });
      }


      logger.info(`Successfully deleted draft bill with ID: ${billId}`);
      res.status(200).json({ message: 'Draft bill deleted successfully', bill: deletedBill });

    } catch (error) {
      logger.error(`Error deleting bill with ID ${req.params.id}:`, error);
      res.status(500).json({ message: 'Internal server error while deleting bill', error: error.message });
    }
  };


export default {
  saveBill,       // POST /api/bills (Handles new drafts AND new finalized)
  getDraftBills,  // GET /api/bills/drafts
  getDraftBill,   // GET /api/bills/drafts/:id (Gets a specific draft by ID) - Route needs to match usage
  finalizeBill,   // POST /api/bills/:id/finalize (Moves draft to final, deletes draft, adds refs) - Changed to POST
  updateDraftBill,// PUT /api/bills/:id (Updates an existing draft) - Route needs to match usage
  getFinalizedBills, // GET /api/bills/finalized (Fetch all finalized bills) - Added route
  getFinalizedBill, // GET /api/bills/:id (Fetch a single finalized bill) - Updated/Clarified route
  deleteBill, // DELETE /api/bills/:id (Deletes a draft bill)
};