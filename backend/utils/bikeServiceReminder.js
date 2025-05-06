// backend/utils/bikeServiceReminder.js

import Customer from '../models/Customer.js'; // Adjust the path to your Customer model
// You will need to implement a function to send messages (e.g., SMS)
// For now, we'll use a placeholder function.
// import sendSMS from './smsService'; // Example: if you have an SMS service utility

// Define the reminder interval in months
const REMINDER_INTERVAL_MONTHS = 3;

// Define a small window around the target date to catch records
// For example, check for billing dates between 3 months and 3 months + 1 day ago
const CHECK_WINDOW_DAYS = 1;


/**
 * Placeholder function to send a message to a customer.
 * Replace this with your actual SMS or messaging service integration.
 * @param {string} phoneNumber - The recipient's phone number.
 * @param {object} customer - The customer document.
 */
const sendMessage = async (phoneNumber, customer) => {
  console.log(`--- Sending service reminder message to ${customer.name} at ${phoneNumber} ---`);
  console.log(`Reminder: Your last service was around ${customer.latestBillingDate.toDateString()}. Time for a check-up!`);
  // Replace this console.log with your actual messaging API call
  // Example: await sendSMS(phoneNumber, `Hi ${customer.name}, your bike/scooter is due for a service! Visit us soon.`);
  console.log('-------------------------------------------------------');
};

export const sendServiceReminders = async () => {
  try {
    console.log('Running scheduled service reminder check...');

    const today = new Date();
    const targetDateStart = new Date(today);
    targetDateStart.setMonth(today.getMonth() - REMINDER_INTERVAL_MONTHS);
    targetDateStart.setHours(0, 0, 0, 0);

    const targetDateEnd = new Date(targetDateStart);
    targetDateEnd.setDate(targetDateStart.getDate() + CHECK_WINDOW_DAYS); // Check up to the end of the next day

    console.log(`Checking for customers billed between ${targetDateStart.toISOString()} and ${targetDateEnd.toISOString()}`);


    // Find customers whose latestBillingDate falls within the target window
    const customersToRemind = await Customer.find({
      latestBillingDate: {
        $gte: targetDateStart, // Greater than or equal to the start of the window
        $lt: targetDateEnd    // Less than the end of the window
      }
    });

    console.log(`Found ${customersToRemind.length} customers due for a reminder.`);

    // Send message to each customer found
    for (const customer of customersToRemind) {
      if (customer.phoneNumber) { // Ensure customer has a phone number
        await sendMessage(customer.phoneNumber, customer);
      } else {
        console.log(`Skipping reminder for customer ${customer.name}: No phone number provided.`);
      }
    }

    console.log('Service reminder check finished.');

  } catch (error) {
    console.error('Error sending service reminders:', error.message);
  }
};
