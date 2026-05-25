const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

/**
 * Records a failed/cancelled payment attempt and reverts the inventory
 * quantity for every saree the user had in cart at the time of payment.
 *
 * Trigger points (front-end): Razorpay modal dismiss, payment.failed event,
 * verify-payment error, browser tab/window close while paying.
 */
const insertPaymentFailure = async (
  failureData,
  result_cartitems,
) => {
  try {
    await pool.query("BEGIN");

    // 1) Audit row in payments (status reflects reason).
    await pool.query(
      `INSERT INTO payments (
        payment_id, order_id, entity, amount, currency,
        method, status, email, contact, notes, captured
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (payment_id) DO NOTHING`,
      [
        failureData.razorpay_payment_id ||
          `FAIL-${failureData.razorpay_order_id}-${Date.now()}`,
        failureData.razorpay_order_id || null,
        "payment",
        Math.round(Number(failureData.amount || 0) * 100),
        failureData.currency || "INR",
        failureData.method || "unknown",
        failureData.status || "failed",
        failureData.email || null,
        failureData.contact || null,
        JSON.stringify({
          type: "saree_order",
          reason: failureData.reason || "unknown",
          source: failureData.source || "client",
        }),
        false,
      ],
    );

    // 2) Revert inventory quantities for whatever was in cart.
    const items = result_cartitems?.data?.items || [];
    for (const it of items) {
      const inventoryId = it.id || it.inventory_id;
      const qty = Number(it.quantity) || 0;
      if (!inventoryId || qty <= 0) continue;
      await pool.query(
        `UPDATE inventory_elements
         SET quantity = quantity + $1
         WHERE id = $2`,
        [qty, inventoryId],
      );
    }

    await pool.query("COMMIT");
    return {
      statuscode: 200,
      successstatus: true,
      message: "Payment failure recorded and inventory reverted.",
      data: { reverted_items: items.length },
    };
  } catch (err) {
    await pool.query("ROLLBACK");
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error handling payment failure. Error: ${err.message}`,
    };
  }
};

module.exports = insertPaymentFailure;
