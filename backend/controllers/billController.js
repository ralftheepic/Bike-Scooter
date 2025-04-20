import Bill from '../models/Billing.js'; // Finalized Bills Model
import DraftBill from '../models/DraftBills.js'; // Draft Bills Model
import Product from '../models/Product.js'; // Product Model for stock updates
import logger from '../utils/logger.js'; // Assuming you have a logger utility

// Save a NEW bill (either as draft or directly finalized)
const saveBill = async (req, res) => {
  const { customerName, customerPhoneNumber, billingDate, items, totalAmount, isDraft } = req.body;

  try {
    // Basic validation
    if (!customerName || !billingDate || !items || items.length === 0 || totalAmount === undefined) {
      logger.warn('Save Bill failed: Missing required fields or empty items.', { body: req.body });
      return res.status(400).json({ message: 'Missing required fields (Customer Name, Date, Items, Total Amount)' });
    }

    // Server-side calculation/validation of total amount (optional but recommended)
    const calculatedTotalAmount = items.reduce((acc, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return acc + price * quantity;
    }, 0);

    if (Math.abs(calculatedTotalAmount - totalAmount) > 0.01) { // Allow for small floating point differences
       logger.warn(`Save Bill failed: Total amount mismatch. Calculated: ${calculatedTotalAmount}, Provided: ${totalAmount}`, { body: req.body });
      return res.status(400).json({ message: `Total amount (${totalAmount.toFixed(2)}) does not match the sum of item prices (${calculatedTotalAmount.toFixed(2)})` });
    }

    // Determine if saving as draft or final
    const BillModel = isDraft ? DraftBill : Bill;
    const billStatus = isDraft ? 'draft' : 'finalized';

    const newBill = new BillModel({
      customerName,
      customerPhoneNumber,
      billingDate,
      items, // Assuming items structure matches schema (productId, nameDescription, price, quantity)
      totalAmount: calculatedTotalAmount, // Use server-calculated total
      isDraft: isDraft, // Explicitly set based on request
    });

    const savedBill = await newBill.save();
    logger.info(`Successfully saved ${billStatus} bill with ID: ${savedBill._id}`);

    // --- If the bill is saved directly as FINALIZED, update the stock ---
    if (!savedBill.isDraft) {
        logger.info(`Updating stock for directly finalized bill ID: ${savedBill._id}`);
        try {
            for (const item of savedBill.items) {
                const { productId, quantity, nameDescription } = item;

                if (!productId) {
                    logger.warn(`Stock Update (Direct Finalize): Missing productId for item "${nameDescription}" in bill ${savedBill._id}. Skipping stock update for this item.`);
                    continue; // Skip if no ID (parsing name is unreliable here)
                }

                const product = await Product.findById(productId);
                if (product) {
                    if (product.quantity >= quantity) {
                        product.quantity -= Number(quantity);
                        await product.save();
                        logger.info(`Stock Update (Direct Finalize): Decreased quantity for Product ID ${productId} ("${product.name}") by ${quantity}`);
                    } else {
                        logger.error(`Stock Update (Direct Finalize): Insufficient stock for Product ID ${productId} ("${product.name}"). Requested: ${quantity}, Available: ${product.quantity}. Bill ${savedBill._id}`);
                        // Decide how to handle: maybe add a note to the bill? For now, just log error.
                    }
                } else {
                    logger.warn(`Stock Update (Direct Finalize): Product not found for Product ID: ${productId} associated with item "${nameDescription}". Bill ${savedBill._id}`);
                }
            }
            logger.info(`Stock update completed for directly finalized bill ID: ${savedBill._id}`);
        } catch(stockError) {
            logger.error(`Stock Update Error (Direct Finalize) for bill ID ${savedBill._id}:`, stockError);
            // Bill is already saved, so we can't easily roll back. Log error prominently.
            // Consider adding a status field to the bill indicating stock update issues.
        }
    }
    // --- End Stock Update Logic ---

    res.status(201).json(savedBill);

  } catch (error) {
    logger.error('Error saving bill:', error);
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
    const draftBill = await DraftBill.findById(req.params.id);
    if (!draftBill) {
      logger.warn(`Get Draft Bill: Draft bill not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Draft bill not found' });
    }
     if (!draftBill.isDraft) {
       logger.warn(`Get Draft Bill requested non-draft bill from draft endpoint. ID: ${req.params.id}`);
       // Or should we return 404? Returning it might be confusing if ID exists but isn't draft.
       // Let's return it but maybe client should handle this.
     }
    res.status(200).json(draftBill);
  } catch (error) {
    logger.error(`Error fetching draft bill with ID: ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching draft bill', error: error.message });
  }
};

// Finalize a specific DRAFT bill (move from DraftBill to Bill collection)
const finalizeBill = async (req, res) => {
  const draftBillId = req.params.id;
  try {
    logger.info(`Attempting to finalize draft bill with ID: ${draftBillId}`);

    // 1. Find the draft bill
    const draftBill = await DraftBill.findById(draftBillId);

    if (!draftBill) {
      logger.warn(`Finalize Bill: Draft bill not found with ID: ${draftBillId}`);
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Double check if it's actually a draft (optional safety)
    if (!draftBill.isDraft) {
        logger.warn(`Finalize Bill: Attempted to finalize a bill that is not marked as draft. ID: ${draftBillId}`);
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
      // Consider adding reference to original draft ID if needed for auditing
      // originalDraftId: draftBill._id
    });

    // 3. Save the new finalized bill
    const savedFinalizedBill = await finalizedBill.save();
    logger.info(`Finalized bill saved successfully to Billing collection with new ID: ${savedFinalizedBill._id} (from draft ID: ${draftBillId})`);

    // 4. Update Stock (crucial step)
    logger.info(`Updating stock for finalized bill ID: ${savedFinalizedBill._id}`);
    try {
        for (const item of savedFinalizedBill.items) {
            const { productId, quantity, nameDescription } = item;

            if (!productId) {
                 logger.warn(`Stock Update (Finalize): Missing productId for item "${nameDescription}" in finalized bill ${savedFinalizedBill._id} (from draft ${draftBillId}). Skipping stock update.`);
                continue; // Highly recommend using productId
            }

            const product = await Product.findById(productId);
            if (product) {
                if (product.quantity >= quantity) {
                    product.quantity -= Number(quantity);
                    await product.save();
                    logger.info(`Stock Update (Finalize): Decreased quantity for Product ID ${productId} ("${product.name}") by ${quantity}. Bill ${savedFinalizedBill._id}`);
                } else {
                    logger.error(`Stock Update (Finalize): Insufficient stock for Product ID ${productId} ("${product.name}"). Requested: ${quantity}, Available: ${product.quantity}. Bill ${savedFinalizedBill._id}`);
                    // Add handling: Maybe mark bill with warning?
                }
            } else {
                logger.warn(`Stock Update (Finalize): Product not found for Product ID: ${productId} associated with item "${nameDescription}". Bill ${savedFinalizedBill._id}`);
            }
        }
        logger.info(`Stock update processing completed for finalized bill ID: ${savedFinalizedBill._id}`);
    } catch(stockError) {
        logger.error(`Stock Update Error (Finalize) for bill ID ${savedFinalizedBill._id} (from draft ${draftBillId}):`, stockError);
        // Critical decision: Should finalization proceed if stock update fails?
        // For now, we proceed but log the error. Consider alternatives like adding an error status to the finalized bill.
    }
    // --- End Stock Update ---


    // 5. Delete the original draft bill *after* successful finalization & stock attempt
    const deletedDraftBill = await DraftBill.findByIdAndDelete(draftBillId);

    if (deletedDraftBill) {
      logger.info(`Draft bill with ID: ${draftBillId} successfully deleted after finalization.`);
    } else {
      // This might happen if the deletion process is interrupted or ID was wrong, but we already found it earlier. Log warning.
      logger.warn(`Draft bill with ID: ${draftBillId} was not found during deletion step, though finalization proceeded.`);
    }

    // 6. Return the newly created finalized bill
    res.status(201).json(savedFinalizedBill);

  } catch (error) {
    logger.error(`Error finalizing bill (Draft ID: ${draftBillId}):`, error);
     if (error.name === 'ValidationError') { // Handle validation errors on saving the final bill
        return res.status(400).json({ message: 'Validation Error on saving finalized bill', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error during bill finalization', error: error.message });
  }
};


// Update an existing DRAFT bill
const updateDraftBill = async (req, res) => {
  const draftBillId = req.params.id;
  const { customerName, customerPhoneNumber, billingDate, items, totalAmount } = req.body;

  try {
    // Validation
    if (!customerName || !billingDate || !items || items.length === 0 || totalAmount === undefined) {
       logger.warn(`Update Draft Bill failed: Missing required fields. ID: ${draftBillId}`, { body: req.body });
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
      return res.status(400).json({ message: `Total amount (${totalAmount.toFixed(2)}) does not match the sum of item prices (${calculatedTotalAmount.toFixed(2)})` });
    }

    const draftBill = await DraftBill.findById(draftBillId);

    if (!draftBill) {
      logger.warn(`Update Draft Bill: Draft bill not found with ID: ${draftBillId}`);
      return res.status(404).json({ message: 'Draft bill not found' });
    }

    // Ensure it's still a draft before updating
    if (!draftBill.isDraft) {
        logger.warn(`Update Draft Bill: Attempted to update a non-draft bill. ID: ${draftBillId}`);
        return res.status(400).json({ message: 'Cannot update a bill that is already finalized.' });
    }

    // Update the draft bill fields
    draftBill.customerName = customerName;
    draftBill.customerPhoneNumber = customerPhoneNumber;
    draftBill.billingDate = billingDate;
    draftBill.items = items; // Overwrite items array
    draftBill.totalAmount = calculatedTotalAmount; // Use server-calculated total
    draftBill.updatedAt = Date.now(); // Manually update timestamp if needed by schema

    const updatedBill = await draftBill.save();
    logger.info(`Successfully updated draft bill with ID: ${updatedBill._id}`);

    res.status(200).json(updatedBill);

  } catch (error) {
    logger.error(`Error updating draft bill with ID: ${draftBillId}:`, error);
     if (error.name === 'ValidationError') {
        return res.status(400).json({ message: 'Validation Error', errors: error.errors });
    }
    res.status(500).json({ message: 'Internal server error updating draft bill', error: error.message });
  }
};

export default {
  saveBill,       // POST /api/bills (Handles new drafts AND new finalized)
  getDraftBills,  // GET /api/bills (Should only return drafts)
  getDraftBill,   // GET /api/bills/:id (Gets a specific draft by ID)
  finalizeBill,   // PUT /api/bills/:id/finalize (Moves draft to final, deletes draft)
  updateDraftBill,// PUT /api/bills/:id (Updates an existing draft)
};