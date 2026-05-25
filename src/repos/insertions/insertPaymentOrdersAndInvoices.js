const { connectDB } = require("../../database/connectDB");
const generateInvoiceId = require("../gets/generateInvoiceId");
const generateOrderId = require("../gets/generateOrderId");
const generateInvoicePdf = require("../../utils/generateInvoicePdf");
const pool = connectDB();
const insertPaymentOrdersAndInvoices = async (
  paymentData,
  ipAddress,
  devicename,
  result_cartitems,
  userdetailsandaddress,
) => {
  try {
    await pool.query("BEGIN");
    // 1. Insert into payments first
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

    //2. insert orders
    const order_id = await generateOrderId();
    const result_orders = await pool.query(
      `insert into orders (user_id, address_id,order_id) values ($1,$2,$3) returning *;`,
      [
        userdetailsandaddress?.user_details?.id,
        userdetailsandaddress?.user_addresses[0].id,
        order_id,
      ],
    );
    //3. insert suborders & update quantity
    for (let i = 0; i < result_cartitems?.data.items.length; i++) {
      const result_suborders = await pool.query(
        `insert into suborders (order_id, inventory_element_data_id, quantity, base_price) values ($1,$2,$3,$4);`,
        [
          result_orders.rows[0].id,
          result_cartitems?.data.items[i].inventory_id,
          result_cartitems?.data.items[i].quantity,
          result_cartitems?.data.items[i].base_price,
        ],
      );
    }
    //4. insert invoices
    const invoice_id = await generateInvoiceId();
    const platform_details = await pool.query(
      `select *from platform_details where is_active=true;`,
    );
    const gst_details = await pool.query(
      `select *from gst_percents where is_active=true;`,
    );
    const offer_details = await pool.query(
      `select *from offers where is_active=true;`,
    );
    const invoice_path = generateInvoicePdf(
      invoice_id,
      platform_details.rows[0],
      userdetailsandaddress,
      result_cartitems,
      gst_details.rows[0],
      offer_details.rows.length > 0 ? offer_details.rows[0] : [],
    );
    const result_invoices = await pool.query(
      `insert into invoices (order_id, payment_id, invoice_id, invoice_path) values ($1,$2,$3,$4) returning *;`,
      [
        result_orders.rows[0].id,
        paymentResult.rows[0].id,
        invoice_id,
        invoice_path,
      ],
    );
    // Finalise the reservation snapshot so the sweeper / failure API
    // won't try to revert stock for an order that actually succeeded.
    await pool.query(
      `UPDATE inventory_reservations
          SET status = 'consumed',
              updated_at = CURRENT_TIMESTAMP
        WHERE razorpay_order_id = $1
          AND status = 'pending'`,
      [paymentData.razorpay_order_id],
    );
    await pool.query(`COMMIT`);
    return {
      statuscode: 200,
      successstatus: true,
      message: "Payment details inserted successfully",
      data: {
        payment_details: paymentData,
        order_details: result_orders.rows[0],
        cart_items: result_cartitems,
        platform_details: platform_details.rows[0],
        gst_details: gst_details.rows[0],
        offer_details: offer_details.rows.length > 0 ? offer_details.rows[0] : null,
        invoice_details: result_invoices.rows[0],
        user_details: userdetailsandaddress?.user_details || null,
        user_address: userdetailsandaddress?.user_addresses?.[0] || null,
      },
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
module.exports = insertPaymentOrdersAndInvoices;
