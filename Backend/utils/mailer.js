const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a reusable transporter using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

/**
 * Sends an HTML receipt to the customer
 * @param {Object} orderData 
 * @param {string} toEmail 
 */
const sendReceiptEmail = async (orderData, toEmail) => {
  if (!toEmail) {
    console.log("No email provided for receipt. Skipping email dispatch.");
    return;
  }

  try {
    // Build the items list HTML
    const itemsHtml = orderData.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee;">${item.quantity}x ${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eeeeee; text-align: right;">${item.price}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Tasty Hot Orders" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Order Receipt - #${orderData.orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333333; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f51c27; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Tasty Hot</h1>
            <p style="color: #ffffff; margin: 5px 0 0 0; opacity: 0.9;">Order Receipt</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; font-weight: bold;">Hi ${orderData.customerName},</p>
            <p>Thank you for your order! Your delicious food is currently <strong>Pending</strong> and will be prepared shortly.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 5px 0;"><strong>Order #:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 0;"><strong>Delivery Address:</strong> ${orderData.address}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px; border-bottom: 2px solid #dddddd;">Item</th>
                  <th style="text-align: right; padding: 10px; border-bottom: 2px solid #dddddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td style="padding: 15px 10px; font-weight: bold; text-align: right; border-bottom: 2px solid #333333;">Total Paid:</td>
                  <td style="padding: 15px 10px; font-weight: bold; text-align: right; color: #1caa00; border-bottom: 2px solid #333333;">AED ${orderData.totalAmount}</td>
                </tr>
              </tfoot>
            </table>

            <p style="text-align: center; color: #777777; font-size: 14px; margin-top: 30px;">
              If you have any questions, feel free to reply to this email. Enjoy your meal!
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Receipt email sent successfully to ${info.envelope.to[0]}`);
    try { require('fs').appendFileSync(__dirname + '/mailer_log.txt', new Date().toISOString() + ' SUCCESS: Sent to ' + info.envelope.to[0] + '\n'); } catch (e) {}
  } catch (error) {
    console.error("❌ Failed to send receipt email:", error);
    try { require('fs').appendFileSync(__dirname + '/mailer_log.txt', new Date().toISOString() + ' ERROR: ' + error.toString() + '\n'); } catch (e) {}
  }
};

module.exports = {
  sendReceiptEmail
};
