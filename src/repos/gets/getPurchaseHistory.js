const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const getPurchaseHistory = async (mobile_number) => {
  try {
    const result_user = await pool.query(
      `select id, user_name, mobile_number from users where mobile_number=$1;`,
      [mobile_number],
    );
    if (0 === result_user.rows.length) {
      return {
        statuscode: 404,
        successstatus: false,
        message: `No purchases found for mobile number ${mobile_number}`,
        data: [],
      };
    }
    const user_id = result_user.rows[0].id;
    const result_orders = await pool.query(
      `select
         o.id              as internal_order_id,
         o.order_id        as order_id,
         o.created_at      as ordered_on,
         inv.invoice_id    as invoice_id,
         inv.invoice_path  as invoice_path,
         p.amount          as amount_paise,
         p.currency        as currency,
         p.status          as payment_status,
         p.method          as payment_method,
         dp.delivery_partner_name,
         ds.delivery_status_name
       from orders o
       left join invoices         inv on inv.order_id = o.id
       left join payments         p   on p.id        = inv.payment_id
       left join shipping_details sd  on sd.invoice_id = inv.id
       left join delivery_partners dp on dp.id = sd.delivery_partner_id
       left join delivery_statuses ds on ds.id = sd.delivery_status_id
       where o.user_id = $1
       order by o.created_at desc;`,
      [user_id],
    );
    const orders = await Promise.all(
      result_orders.rows.map(async (row) => {
        const result_items = await pool.query(
          `select
             s.quantity,
             s.base_price,
             ie.title,
             ie.color,
             ie.material,
             ie.combined_code,
             ie.img_directory
           from suborders s
           left join inventory_elements ie on ie.id = s.inventory_element_data_id
           where s.order_id = $1`,
          [row.internal_order_id],
        );
        return {
          order_id: row.order_id,
          ordered_on: row.ordered_on,
          invoice_id: row.invoice_id,
          invoice_path: row.invoice_path,
          amount: row.amount_paise ? row.amount_paise / 100 : null,
          currency: row.currency,
          payment_status: row.payment_status,
          payment_method: row.payment_method,
          delivery_partner_name: row.delivery_partner_name,
          delivery_status_name: row.delivery_status_name,
          items: result_items.rows,
        };
      }),
    );
    return {
      statuscode: 200,
      successstatus: true,
      message:
        orders.length > 0
          ? "Purchase history fetched successfully"
          : "No purchases found for this mobile number",
      data: {
        user: result_user.rows[0],
        orders,
      },
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching purchase history. Error: ${err.message}`,
    };
  }
};

module.exports = getPurchaseHistory;
