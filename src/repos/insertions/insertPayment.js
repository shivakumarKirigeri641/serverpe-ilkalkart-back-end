const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const insertPayment = async (paymentData) => {
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
    await pool.query(`COMMIT`);
    return {
      statuscode: 200,
      successstatus: true,
      message: "Payment details inserted successfully",
      data: paymentResult.rows[0],
    };
  } catch (err) {
    await pool.query(`ROLLBACK`);
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error in inserting payment data. Error: ${err.message}`,
    };
  } finally {
  }
};
module.exports = insertPayment;
