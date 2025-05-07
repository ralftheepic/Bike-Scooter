import Bill from '../models/Billing.js';
import DraftBill from '../models/DraftBills.js';
import Product from '../models/Product.js';
import Customer from '../models/Customers.js';
import Payment from '../models/Payment.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Helper function to handle Customer and Payment linking
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
             // Update latest billing date if the current bill date is more recent
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

         // Create the Payment record
         logger.info('Value of paymentMethod before creating Payment document:', paymentMethod);
         const payment = new Payment({
             billingId: savedBillId,
             customerId: customerId,
             customerName: customer.name,
             customerPhoneNumber: customer.phoneNumber,
             billingDate: billingDate,
             totalAmount: totalAmount,
             paymentMethod: paymentMethod,
             paymentDate: new Date(), // Use current date for payment date
         });
         await payment.save({ session });
         paymentId = payment._id;
         logger.info(`Payment record created with ID: ${paymentId} for bill ID: ${savedBillId}`);

         // Update the Bill document with customer and payment references and finalized date
         await Bill.findByIdAndUpdate(savedBillId, {
             customerRef: customerId,
             paymentRef: paymentId,
             finalizedAt: new Date(),
         }, { session, new: true }); // Use {new: true} to return the updated document (optional here)


         logger.info(`Bill ID ${savedBillId} updated with customerRef ${customerId} and paymentRef ${paymentId}`);

         return { customerRef: customerId, paymentRef: paymentId }; // Return the created refs

     } catch (error) {
         logger.error(`Error during customer/payment linking for bill ID ${savedBillId}:`, error);
         // Re-throw the error so it's caught by the main transaction catch block
         throw error;
     }
};


// Handles saving new bills (both drafts and potentially finalized directly)
export const saveBill = async (req, res) => {
  const { customerName, customerPhoneNumber, billingDate, items, totalAmount, isDraft, paymentMethod } = req.body;

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

    const calculatedTotalAmount = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return acc + price * quantity;
    }, 0);

    if (Math.abs(calculatedTotalAmount - totalAmount) > 0.01) {
      logger.warn(`Save Bill failed: Total amount mismatch. Calculated: ${calculatedTotalAmount}, Provided: ${totalAmount}`, { body: req.body });
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: `Total amount (${totalAmount.toFixed(2)}) does not match the sum of item prices (${calculatedTotalAmount.toFixed(2)})`
      });
    }

    const BillModel = isDraft ? DraftBill : Bill;
    const billStatus = isDraft ? 'draft' : 'finalized';

    // --- Item Mapping and Validation based on Draft Status ---
    const itemsToSave = await Promise.all(items.map(async (item, index) => {
      let productObjectId = item.product || item.productId; // Start with product ObjectId or custom productId from input
      let foundProduct = null;

      // If product ObjectId is missing, try to find the product by partNumber or productId
      if (!productObjectId || !mongoose.Types.ObjectId.isValid(productObjectId)) { // Check if it's missing OR not a valid ObjectId format
        logger.info(`Save Bill: Product ObjectId missing or invalid for item at index ${index}. Attempting lookup.`);

        // --- Enhanced Lookup Logic ---
        // 1. Try finding by partNumber first (using the correct field name)
        if (item.partNumber) {
          logger.info(`Save Bill: Attempting lookup by partNumber: "${item.partNumber}"`);
          foundProduct = await Product.findOne({ partNumber: item.partNumber }).session(session); // CORRECTED FIELD NAME to partNumber
          if (foundProduct) {
            productObjectId = foundProduct._id;
            logger.info(`Save Bill: Found product by partNumber. Product ID: ${productObjectId}.`);
          } else {
            logger.warn(`Save Bill: Product not found by partNumber: "${item.partNumber}".`);
          }
        }

        // 2. If not found by partNumber, try finding by productId (your custom ID)
        if (!foundProduct && item.productId) { // Check item.productId from the input item
          logger.info(`Save Bill: Attempting lookup by productId: "${item.productId}"`);
          foundProduct = await Product.findOne({ productId: item.productId }).session(session); // Assuming field is 'productId'
          if (foundProduct) {
            productObjectId = foundProduct._id;
            logger.info(`Save Bill: Found product by productId. Product ID: ${productObjectId}.`);
          } else {
            logger.warn(`Save Bill: Product not found by productId: "${item.productId}".`);
          }
        }
         // --- End Enhanced Lookup Logic ---
      } else {
         // If product ObjectId was already present and valid, verify the product exists.
         foundProduct = await Product.findById(productObjectId).session(session);
         if (!foundProduct) {
             logger.warn(`Save Bill failed: Product with ID ${productObjectId} not found in database for item at index ${index}.`);
             const error = new Error(`Product for item "${item.nameDescription || item.partNumber}" not found in inventory.`);
             error.isClientError = true;
             throw error;
         }
         logger.info(`Save Bill: Product ObjectId ${productObjectId} already present and valid for item at index ${index}.`);
      }


      // Validate that we now have a valid product ObjectId for the finalized bill
      // This check is crucial for FINALIZED bills. For DRAFTS, product can be null.
      if (!isDraft && (!productObjectId || !mongoose.Types.ObjectId.isValid(productObjectId))) {
        logger.warn(`Save Bill failed: Item at index ${index} is missing a valid product ID for a FINALIZED bill after all lookup attempts.`, { itemData: item });
        // Throw a specific error that can be caught below to abort transaction
        const error = new Error(`Product selection required for item "${item.nameDescription || item.partNumber}" to finalize bill.`);
        error.isClientError = true; // Custom flag to identify client-side input issue
        throw error; // This will be caught by the outer catch block
      }

      // Prepare the item structure based on whether it's a draft or finalized
      const itemToReturn = {
        // Only include product if it's found and valid, or if it's a draft (where it can be null)
        product: (productObjectId && mongoose.Types.ObjectId.isValid(productObjectId)) ? new mongoose.Types.ObjectId(productObjectId) : undefined,
        price: Number(item.price),
        quantity: Number(item.quantity),
      };

      if (isDraft) {
        // For drafts, include additional fields from the frontend item structure
        itemToReturn.nameDescription = item.nameDescription || '';
        itemToReturn.partNumber = item.partNumber || ''; // Keep partNumber from input for drafts
         itemToReturn.productId = item.productId || ''; // Keep custom productId from input for drafts
      }

      return itemToReturn;
    }));
    // --- End Item Mapping and Validation ---


    const newBill = new BillModel({
      customerName,
      customerPhoneNumber,
      billingDate,
      items: itemsToSave, // Use the validated/mapped items array
      totalAmount: calculatedTotalAmount,
      paymentMethod, // Include paymentMethod here (as it's in DraftBill schema)
      isDraft,
      // customerRef, paymentRef, finalizedAt will be set if not draft
    });

    const savedBill = await newBill.save({ session });
    logger.info(`Successfully saved ${billStatus} bill with ID: ${savedBill._id}`);

    // --- Finalization Path (only for non-drafts saved directly) ---
    if (!isDraft) {
      logger.info(`Processing direct finalization for bill ID: ${savedBill._id}`);

      try {
        // handleCustomerAndPaymentLinking now expects the saved Bill ID
        const { customerRef, paymentRef } = await handleCustomerAndPaymentLinking({
          ...req.body, // Pass original request body for customer/payment details
          totalAmount: calculatedTotalAmount // Use calculated total
        }, savedBill._id, session);

        // Update the savedBill document in memory (optional but good for response)
        savedBill.customerRef = customerRef;
        savedBill.paymentRef = paymentRef;
        savedBill.finalizedAt = new Date();

        // --- Stock Update ---
        logger.info(`Updating stock for directly finalized bill ID: ${savedBill._id}`);
        // Loop through the items *from the savedBill* (which now have product ObjectIds)
        for (const item of savedBill.items) {
            // item.product is guaranteed to be a valid ObjectId here due to the validation above
            const product = await Product.findById(item.product).session(session);

            // This check is still important in case the product was deleted between validation and stock update
            if (!product) {
                logger.error(`Stock Update (Direct Finalize): Product not found for ID ${item.product}. Bill ${savedBill._id}`);
                const error = new Error(`Product with ID ${item.product} not found during stock update.`);
                error.isClientError = true; // Treat as client-side input issue (invalid product ID)
                throw error; // This will be caught by the outer catch block
            }

            if (product.quantity < item.quantity) {
                logger.error(`Stock Update (Direct Finalize): Insufficient stock for product ${item.product}. Required: ${item.quantity}, Available: ${product.quantity}. Bill ${savedBill._id}`);
                const error = new Error(`Insufficient stock for product ${item.product}. Required: ${item.quantity}, Available: ${product.quantity}`);
                error.isClientError = true; // Treat as client-side input issue
                throw error; // This will be caught by the outer catch block
            }

            product.quantity -= item.quantity;
            await product.save({ session });
            logger.info(`Updated stock for product ${item.product} by -${item.quantity} for bill ${savedBill._id}`);
        }
        logger.info(`Stock update completed for directly finalized bill ID: ${savedBill._id}`);
        // --- End Stock Update ---

      } catch (finalizationError) {
        // Catch errors specifically from the finalization steps (linking, stock update)
        logger.error(`Finalization error for bill ID ${savedBill._id}:`, finalizationError);
        await session.abortTransaction(); // Abort the transaction on any finalization error
        session.endSession();
        // Determine status code based on the error type
        const statusCode = finalizationError.isClientError ? 400 : 500;
        return res.status(statusCode).json({ message: finalizationError.message || 'Error during finalization' });
      }
    }

    // If we reach here, either it was a draft save or finalization was successful
    await session.commitTransaction();
    session.endSession();

    // Return the saved bill (which now includes customerRef, paymentRef, finalizedAt if finalized)
    res.status(201).json(savedBill);

  } catch (error) {
    // This catches errors from initial validation or the item mapping/validation step
    logger.error('Error saving bill:', error);

    // Ensure session is ended if an error occurred before commit
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (!session.hasEnded) { // Double check session hasn't already ended
      session.endSession();
    }


    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      logger.warn('Mongoose Validation Error during saveBill:', error.message);
      return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }

    // Handle custom client errors thrown during item validation
    if (error.isClientError) {
      logger.warn('Client-side data error during saveBill:', error.message);
      return res.status(400).json({ message: error.message });
    }


    // Handle any other unexpected errors
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
    const { paymentMethod } = req.body; // paymentMethod should be sent in the body

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

      // --- Map and Validate items for the Finalized Bill ---
      // We need to convert DraftBill items structure to Billing items structure
      const itemsForFinalizedBill = await Promise.all(draftBill.items.map(async (item, index) => {
        let productObjectId = item.product; // Start with the product ObjectId if it exists in the draft
        let foundProduct = null;

        logger.info(`Processing item ${index} for finalization:`, {
          draftItemId: item._id, // Log the draft item ID if available
          initialProductObjectId: item.product,
          partNumber: item.partNumber,
          productId: item.productId, // Log the custom productId from the draft item
          nameDescription: item.nameDescription
        });


        // If product ObjectId is missing or invalid, try to find the product by partNumber or productId
        if (!productObjectId || !mongoose.Types.ObjectId.isValid(productObjectId)) { // Check if it's missing OR not a valid ObjectId format
          logger.info(`Finalize Bill: Product ObjectId missing or invalid for item at index ${index}. Attempting lookup.`);

          // --- Enhanced Lookup Logic ---
          // 1. Try finding by partNumber first (using the correct field name)
          if (item.partNumber) {
            logger.info(`Finalize Bill: Attempting lookup by partNumber: "${item.partNumber}"`);
            foundProduct = await Product.findOne({ partNumber: item.partNumber }).session(session); // CORRECTED FIELD NAME to partNumber
            if (foundProduct) {
              productObjectId = foundProduct._id;
              logger.info(`Finalize Bill: Found product by partNumber. Product ID: ${productObjectId}.`);
            } else {
              logger.warn(`Finalize Bill: Product not found by partNumber: "${item.partNumber}".`);
            }
          }

          // 2. If not found by partNumber, try finding by productId (your custom ID)
          if (!foundProduct && item.productId) { // Check item.productId from the draft item
            logger.info(`Finalize Bill: Attempting lookup by productId: "${item.productId}"`);
            foundProduct = await Product.findOne({ productId: item.productId }).session(session); // Assuming field is 'productId'
            if (foundProduct) {
              productObjectId = foundProduct._id;
              logger.info(`Finalize Bill: Found product by productId. Product ID: ${productObjectId}.`);
            } else {
              logger.warn(`Finalize Bill: Product not found by productId: "${item.productId}".`);
            }
          }
          // --- End Enhanced Lookup Logic ---
        } else {
          // If product ObjectId was already present and valid, verify the product exists.
          foundProduct = await Product.findById(productObjectId).session(session);
          if (!foundProduct) {
              logger.warn(`Finalize Bill failed: Product with ID ${productObjectId} not found in database for item at index ${index}.`);
              const error = new Error(`Product for item "${item.nameDescription || item.partNumber}" not found in inventory.`);
              error.isClientError = true;
              throw error;
          }
          logger.info(`Finalize Bill: Product ObjectId ${productObjectId} already present and valid for item at index ${index}.`);
        }


        // Validate that we now have a valid product ObjectId for the finalized bill
        if (!productObjectId || !mongoose.Types.ObjectId.isValid(productObjectId)) {
          logger.warn(`Finalize Bill failed: Item at index ${index} is missing a valid product ID after all lookup attempts.`, { itemData: item });
          // Throw a specific error that can be caught below to abort transaction
          const error = new Error(`Product selection required for item "${item.nameDescription || item.partNumber}" to finalize bill.`);
          error.isClientError = true; // Custom flag to identify client-side input issue
          throw error; // This will be caught by the outer catch block
        }

        // Return the item in the structure required by the Billing schema
        return {
          product: new mongoose.Types.ObjectId(productObjectId), // Ensure it's a Mongoose ObjectId
          quantity: Number(item.quantity),
          price: Number(item.price), // Use the price stored in the draft item
        };
      }));
      // --- End Item Mapping and Validation ---


      // 2. Create a new finalized bill in the 'Billing' collection using the mapped items
      const finalizedBill = new Bill({
        customerName: draftBill.customerName,
        customerPhoneNumber: draftBill.customerPhoneNumber,
        billingDate: draftBill.billingDate,
        items: itemsForFinalizedBill, // Use the correctly mapped and validated items
        totalAmount: draftBill.totalAmount, // Use total from draft (already validated by saveBill)
        isDraft: false, // Mark as finalized
        // originalDraftId: draftBill._id // Optional: Keep a reference to the original draft
      });

      // 3. Save the new finalized bill within the session
      const savedFinalizedBill = await finalizedBill.save({ session });
      logger.info(`Finalized bill saved successfully to Billing collection with new ID: ${savedFinalizedBill._id} (from draft ID: ${draftBillId})`);

      // 4. Handle Customer and Payment Linking within the session
      try {
          // Pass necessary data including paymentMethod to the helper
          // Use data from the original draft bill and the paymentMethod from req.body
          await handleCustomerAndPaymentLinking({
            customerName: draftBill.customerName,
            customerPhoneNumber: draftBill.customerPhoneNumber,
            billingDate: draftBill.billingDate,
            totalAmount: draftBill.totalAmount,
            paymentMethod: paymentMethod // Use the paymentMethod from the finalize request body
          }, savedFinalizedBill._id, session);

          logger.info(`Customer and payment linking completed for finalized bill ID: ${savedFinalizedBill._id}`);

          // Note: The handleCustomerAndPaymentLinking helper updates the Bill document directly.
          // savedFinalizedBill object in memory might not have the refs populated unless refetched.
          // If you need the refs in the response, you might refetch the bill here.
          // const finalBillToSend = await Bill.findById(savedFinalizedBill._id).session(session);


      } catch(linkingError) {
          logger.error(`Linking Error during finalization for bill ID ${savedFinalizedBill._id} (from draft ${draftBillId}):`, linkingError);
          // CRITICAL: Linking failed, abort the transaction.
          await session.abortTransaction();
          session.endSession();
          // Return an appropriate error response
          const statusCode = linkingError.isClientError ? 400 : 500;
          return res.status(statusCode).json({ message: linkingError.message || 'An error occurred during customer/payment linking.' });
      }


      // 5. Update Stock (crucial step) within the session
      logger.info(`Updating stock for finalized bill ID: ${savedFinalizedBill._id}`);
      try {
          // Loop through the items *from the savedFinalizedBill* (which now have product ObjectIds)
          for (const item of savedFinalizedBill.items) {
              // item.product is guaranteed to be a valid ObjectId here due to the validation during item mapping
              const product = await Product.findById(item.product).session(session);

              // This check is still important in case the product was deleted between mapping and stock update
              if (!product) {
                  logger.error(`Stock Update (Finalize): Product not found for ID ${item.product}. Bill ${savedFinalizedBill._id}`);
                  const error = new Error(`Product with ID ${item.product} not found during stock update.`);
                  error.isClientError = true; // Treat as client-side input issue (invalid product ID)
                  throw error; // This will be caught by the outer catch block
              }

              if (product.quantity < item.quantity) {
                  logger.error(`Stock Update (Finalize): Insufficient stock for product ${item.product}. Required: ${item.quantity}, Available: ${product.quantity}. Bill ${savedFinalizedBill._id}`);
                  const error = new Error(`Insufficient stock for product ${item.product}. Required: ${item.quantity}, Available: ${product.quantity}`);
                  error.isClientError = true; // Treat as client-side input issue
                  throw error; // This will be caught by the outer catch block
              }

              product.quantity -= item.quantity;
              await product.save({ session });
              logger.info(`Updated stock for product ${item.product} by -${item.quantity} for bill ${savedFinalizedBill._id}`);
          }
          logger.info(`Stock update processing completed for finalized bill ID: ${savedFinalizedBill._id}`);
      } catch(stockError) {
          logger.error(`Stock Update Error (Finalize) for bill ID ${savedFinalizedBill._id} (from draft ${draftBillId}):`, stockError);
          // Transaction is aborted by stock update logic, just re-throw or handle gracefully
          await session.abortTransaction(); // Ensure session is aborted
          session.endSession();
          // If the error wasn't a stock/product validation error, return a generic 500
          const statusCode = stockError.isClientError ? 400 : 500;
          return res.status(statusCode).json({ message: stockError.message || 'An error occurred during stock update.' });
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
      // Fetch the fully updated document to ensure refs are populated if needed for the response
      // Use the session for the final fetch, it should still be valid after commit
      const finalBillToSend = await Bill.findById(savedFinalizedBill._id)
        .populate('customerRef')
        .populate('paymentRef');
        // Removed .session(session) from the final fetch after commit,
        // as the session might be implicitly ended after commit in some Mongoose versions/configurations.
        // Fetching without the session here is generally safe after a successful commit.


      res.status(201).json(finalBillToSend);

    } catch (error) {
      // This catches errors from finding the draft bill, item mapping/validation, or other unexpected errors
      logger.error(`Error finalizing bill (caught by outer catch, Draft ID: ${draftBillId}):`, error);
      // Ensure session is ended if an error occurred before commit
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      if (!session.hasEnded) { // Double check session hasn't already ended
        session.endSession();
      }

      // Handle specific error types
      if (error.isClientError) { // Handle custom client errors thrown during item validation or stock check
        logger.warn('Client-side data error during finalizeBill:', error.message);
        return res.status(400).json({ message: error.message });
      }
      if (error.name === 'ValidationError') { // Handle Mongoose validation errors on saving the final bill
        logger.warn('Mongoose Validation Error during finalizeBill:', error.message);
        return res.status(400).json({ message: 'Validation Error on saving finalized bill', errors: error.errors });
      }
      if (error.kind === 'ObjectId') { // Handle invalid draftBillId format
        logger.warn('Invalid ObjectId format for draftBillId:', draftBillId);
        return res.status(400).json({ message: 'Invalid Draft Bill ID format' });
      }

      // Handle any other unexpected errors
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
        path: 'items.product',
        select: 'partNumber name brand model fit', // Corrected from partNo to partNumber
      })
      .populate('customerRef')
      .populate('paymentRef');

    const billsWithExtractedDetails = finalizedBills.map(bill => ({
      ...bill.toObject(),
      items: bill.items.map(item => {
        if (item.product && typeof item.product === 'object') {
          return {
            ...item.toObject(),
            product: {
              id: item.product._id,
              partNumber: item.product.partNumber || 'N/A', // Corrected from partNo to partNumber
              name: item.product.name || 'N/A',
              brand: item.product.brand || 'N/A',
              model: item.product.model || 'N/A',
            },
          };
        } else {
          return {
            ...item.toObject(),
            product: {
              id: 'N/A',
              partNumber: 'N/A',
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
        logger.info(`Fetching single finalized bill with ID: ${billId}`); // Corrected log message

        const finalizedBill = await Bill.findOne({ _id: billId, isDraft: false })
             .populate({
                path: 'items.product', // Populate the 'product' field which is the ObjectId reference
                select: 'partNumber name brand model description productId', // Corrected from partNo to partNumber, Include productId in select
            })
            .populate('customerRef')
            .populate('paymentRef');


        if (!finalizedBill) {
            logger.warn(`Get Finalized Bill: Bill not found or not finalized with ID: ${billId}`);
            return res.status(404).json({ message: 'Finalized bill not found' });
        }

        res.status(200).json(finalizedBill.toObject()); // Use toObject() to get a plain JS object

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

      // Use findOneAndDelete and check if it was a draft
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
  getDraftBill,   // GET /api/bills/drafts/:id (Gets a specific draft by ID)
  finalizeBill,   // POST /api/bills/:id/finalize (Moves draft to final, deletes draft, adds refs)
  updateDraftBill,// PUT /api/bills/:id (Updates an existing draft)
  getFinalizedBills, // GET /api/bills/finalized (Fetch all finalized bills)
  getFinalizedBill, // GET /api/bills/:id (Fetch a single finalized bill)
  deleteBill, // DELETE /api/bills/:id (Deletes a draft bill)
};
