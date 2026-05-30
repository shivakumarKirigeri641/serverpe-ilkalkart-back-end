const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const reserveInventoryForOrder = async (
  razorpay_order_id,
  ipAddress,
  devicename,
  user_id = null,
) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cartRowsResult = user_id
      ? await client.query(
          `SELECT c.inventory_element_id, c.quantity
             FROM cart c
            WHERE c.user_id = $1
              AND COALESCE(c.is_active, true) = true
            ORDER BY c.id`,
          [user_id],
        )
      : await client.query(
          `SELECT c.inventory_element_id, c.quantity
             FROM cart c
            WHERE c.ip_address = $1
              AND c.user_agent = $2
              AND COALESCE(c.is_active, true) = true
            ORDER BY c.id`,
          [ipAddress, devicename],
        );

    const cartRows = cartRowsResult.rows;
    if (cartRows.length === 0) {
      await client.query("ROLLBACK");
      return {
        statuscode: 400,
        successstatus: false,
        message: "Cart is empty — nothing to reserve.",
      };
    }

    const outOfStock = [];

    for (const row of cartRows) {
      const inventoryId = row.inventory_element_id;
      const qty = Number(row.quantity) || 0;
      if (qty <= 0) continue;

      const upd = await client.query(
        `UPDATE inventory_elements
            SET quantity = quantity - $1
          WHERE id = $2
            AND quantity >= $1
        RETURNING id, title, color, quantity`,
        [qty, inventoryId],
      );

      if (upd.rowCount === 0) {
        const stockRow = await client.query(
          `SELECT id, title, color, quantity
             FROM inventory_elements
            WHERE id = $1`,
          [inventoryId],
        );
        const s = stockRow.rows[0] || {};
        outOfStock.push({
          inventory_element_id: inventoryId,
          title: s.title || "Saree",
          color: s.color || null,
          available: Number(s.quantity) || 0,
          requested: qty,
        });
        continue;
      }

      await client.query(
        `INSERT INTO inventory_reservations
           (razorpay_order_id, inventory_element_id, quantity, status)
         VALUES ($1, $2, $3, 'pending')`,
        [razorpay_order_id, inventoryId, qty],
      );
    }

    if (outOfStock.length > 0) {
      await client.query("ROLLBACK");
      return {
        statuscode: 409,
        successstatus: false,
        message: "One or more sarees are out of stock.",
        data: { out_of_stock: outOfStock },
      };
    }

    await client.query("COMMIT");
    return {
      statuscode: 200,
      successstatus: true,
      message: "Inventory reserved.",
      data: { reserved_lines: cartRows.length },
    };
  } catch (err) {
    await client.query("ROLLBACK");
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error reserving inventory. Error: ${err.message}`,
    };
  } finally {
    client.release();
  }
};

module.exports = reserveInventoryForOrder;
