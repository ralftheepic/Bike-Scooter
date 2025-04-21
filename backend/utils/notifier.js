// utils/notifier.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

export const sendBulkLowStockAlert = async (lowStockProducts = []) => {
  if (!lowStockProducts.length) return;

  // HTML table rows
  const tableRows = lowStockProducts.map((p, i) => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${i + 1}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.brand}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.model}</td>
      <td style="padding: 8px; border: 1px solid #ddd;">${p.quantity}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <h2>⚠️ Low Stock Alert</h2>
    <p>The following products are running low on stock:</p>
    <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; border: 1px solid #ddd;">#</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Name</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Brand</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Model</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <p>Please restock them at the earliest.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECEIPENT_USER,
    subject: '⚠️ Consolidated Low Stock Alert',
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Low stock email sent with ${lowStockProducts.length} products.`);
  } catch (error) {
    console.error('Failed to send alert:', error.message);
  }
};
