const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const insertPaymentAndOrder = async (
  users_logger_id,
  paymentData,
  vehicle_rc_ids,
  address_id,
  price_per_set,
  gst_percentage,
) => {
  try {
    await pool.query("BEGIN");
    // 1. Insert into payments
    const paymentResult = await pool.query(
      `INSERT INTO payments (
        payment_id, order_id, entity, amount, currency,
        method, status, email, contact, notes, captured
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        paymentData.razorpay_payment_id,
        paymentData.razorpay_order_id,
        "payment",
        Math.round(paymentData.amount * 100), // store in paise
        paymentData.currency || "INR",
        paymentData.method || "unknown",
        paymentData.status || "captured",
        paymentData.email || null,
        paymentData.contact || null,
        JSON.stringify({
          signature: paymentData.razorpay_signature,
          type: "saree_order",
        }),
        paymentData.status === "captured",
      ],
    );
    const payment_id = paymentResult.rows[0].id;

    // 2. order information & suborder information

    // 3. Insert into invoices with QRO- prefix
    const invoiceNumber = `SR-${Date.now()}`;
    const invoicePath = `uploads/invoices/${invoiceNumber}.pdf`;

    const invoiceResult = await pool.query(
      `INSERT INTO invoices (
        fkpayments, invoice_number, invoice_date, amount, gst_percentage, invoice_path
      ) VALUES ($1,$2,CURRENT_DATE,$3,$4,$5) RETURNING *`,
      [
        payment_id,
        invoiceNumber,
        paymentData.amount,
        gst_percentage || 0,
        invoicePath,
      ],
    );
    const invoice_id = invoiceResult.rows[0].id;
  } catch (err) {
  } finally {
  }
};
module.exports = insertPaymentAndOrder;
