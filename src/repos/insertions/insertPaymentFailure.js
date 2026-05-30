const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

/**
 * Records a failed/cancelled payment attempt and reverts the inventory
 * quantity for every saree that was reserved at /create-order time.
 *
 * Reverts read from inventory_reservations (snapshot keyed by razorpay
 * order id) — NOT from the live cart, since the user may have changed
 * the cart between create-order and the failure event.
 *
 * Trigger points (front-end): Razorpay modal dismiss, payment.failed,
 * verify-payment error, browser tab/window close while paying. Also
 * called server-side when create-order itself rolls back, and by the
 * stale-reservation sweeper.
 */
const insertPaymentFailure = async (failureData, razorpay_order_id) => {
  const orderId = razorpay_order_id || failureData?.razorpay_order_id || null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `INSERT INTO payments (
        payment_id, order_id, entity, amount, currency,
        method, status, email, contact, notes, captured
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (payment_id) DO NOTHING`,
      [
        failureData.razorpay_payment_id ||
          `FAIL-${orderId || "noorder"}-${Date.now()}`,
        orderId,
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

    let revertedLines = 0;
    if (orderId) {
      const pending = await client.query(
        `SELECT id, inventory_element_id, quantity
           FROM inventory_reservations
          WHERE razorpay_order_id = $1
            AND status = 'pending'
          FOR UPDATE`,
        [orderId],
      );

      for (const r of pending.rows) {
        await client.query(
          `UPDATE inventory_elements
              SET quantity = quantity + $1
            WHERE id = $2`,
          [r.quantity, r.inventory_element_id],
        );
        await client.query(
          `UPDATE inventory_reservations
              SET status = 'reverted',
                  reason = $2,
                  updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [r.id, failureData.reason || "unknown"],
        );
        revertedLines += 1;
      }
    }

    await client.query("COMMIT");
    return {
      statuscode: 200,
      successstatus: true,
      message: "Payment failure recorded and inventory reverted.",
      data: { reverted_lines: revertedLines },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error handling payment failure. Error: ${err.message}`,
    };
  } finally {
    client.release();
  }
};

module.exports = insertPaymentFailure;
