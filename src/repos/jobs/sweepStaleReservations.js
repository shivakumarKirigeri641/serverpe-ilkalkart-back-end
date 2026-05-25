const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const STALE_MINUTES = Number(process.env.RESERVATION_STALE_MINUTES || 20);

const sweepStaleReservations = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const stale = await client.query(
      `SELECT id, razorpay_order_id, inventory_element_id, quantity
         FROM inventory_reservations
        WHERE status = 'pending'
          AND created_at < (CURRENT_TIMESTAMP - ($1 || ' minutes')::interval)
        FOR UPDATE SKIP LOCKED`,
      [String(STALE_MINUTES)],
    );

    for (const r of stale.rows) {
      await client.query(
        `UPDATE inventory_elements
            SET quantity = quantity + $1
          WHERE id = $2`,
        [r.quantity, r.inventory_element_id],
      );
      await client.query(
        `UPDATE inventory_reservations
            SET status = 'reverted',
                reason = 'sweeper_stale',
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [r.id],
      );
    }

    await client.query("COMMIT");
    if (stale.rowCount > 0) {
      console.log(
        `[reservation-sweeper] reverted ${stale.rowCount} stale reservation(s).`,
      );
    }
    return { reverted: stale.rowCount };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[reservation-sweeper] error:", err.message);
    return { reverted: 0, error: err.message };
  } finally {
    client.release();
  }
};

module.exports = sweepStaleReservations;
