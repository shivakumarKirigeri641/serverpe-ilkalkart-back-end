const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const trackOrder = async (order_id) => {
  try {
    const result_order = await pool.query(
      `select *from orders where order_id=$1`,
      [order_id],
    );
    if (0 === result_order.rows.length) {
      return {
        statuscode: 404,
        successstatus: false,
        message: `${order_id} not found!`,
      };
    }

    const result_invoice = await pool.query(
      `select *from invoices where order_id=$1`,
      [result_order.rows[0].id],
    );
    if (0 === result_invoice.rows.length) {
      return {
        statuscode: 404,
        successstatus: false,
        message: `${order_id}/Invoice not found!`,
      };
    }
    const result_shippingdetails = await pool.query(
      `select dp.delivery_partner_name, dp.description, ds.delivery_status_name, ds.description as ds_description, sd.invoice_id from shipping_details sd
        join delivery_partners dp on sd.delivery_partner_id = dp.id
        join delivery_statuses ds on sd.delivery_status_id = ds.id
        where invoice_id=$1`,
      [result_invoice.rows[0].id],
    );
    return {
      statuscode: 200,
      successstatus: true,
      message:
        result_shippingdetails.rows.length > 0
          ? `Delivery/Shipment details updated.`
          : `Order confirmed, Shipment details will be updated soon and you will get notification for same. Stay tuned.`,
      data:
        result_shippingdetails.rows.length > 0
          ? result_shippingdetails.rows[0]
          : [],
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching order details. Error: ${err.message}`,
    };
  }
};

module.exports = trackOrder;
