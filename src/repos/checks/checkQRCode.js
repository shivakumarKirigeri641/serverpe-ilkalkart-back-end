const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const SELECT_QR_DETAILS = `
  SELECT
    s.id                AS suborder_id,
    s.secret_qrcode,
    s.qrcode_link,
    s.secrete_qrcode_check_status,
    s.quantity,
    s.base_price,
    s.created_at        AS purchased_on,

    o.order_id,
    o.created_at        AS order_placed_on,

    inv.invoice_id,
    inv.invoice_path,

    ie.id               AS saree_id,
    ie.title            AS saree_title,
    ie.type_name        AS saree_type,
    ie.color            AS saree_color,
    ie.material         AS saree_material,
    ie.border           AS saree_border,
    ie.pallu            AS saree_pallu,
    ie.blouse           AS saree_blouse,
    ie.handloom         AS saree_handloom,
    ie.combined_code    AS saree_code,
    ie.dimension_length AS saree_length,
    ie.dimension_width  AS saree_width,
    ie.description1     AS saree_description1,
    ie.description2     AS saree_description2,
    ie.img_directory    AS saree_img_directory,

    u.user_name         AS buyer_name,
    RIGHT(u.mobile_number::text, 4) AS buyer_mobile_last4,

    dp.delivery_partner_name,
    ds.delivery_status_name
  FROM suborders s
  LEFT JOIN orders             o   ON o.id   = s.order_id
  LEFT JOIN invoices           inv ON inv.order_id = o.id
  LEFT JOIN inventory_elements ie  ON ie.id  = s.inventory_element_data_id
  LEFT JOIN users              u   ON u.id   = o.user_id
  LEFT JOIN shipping_details   sd  ON sd.invoice_id = inv.id
  LEFT JOIN delivery_partners  dp  ON dp.id  = sd.delivery_partner_id
  LEFT JOIN delivery_statuses  ds  ON ds.id  = sd.delivery_status_id
  WHERE s.secret_qrcode = $1
`;

const buildPayload = (row) => ({
  qrcode: row.secret_qrcode,
  qrcode_link: row.qrcode_link,
  purchased_on: row.purchased_on,
  order: {
    order_id: row.order_id,
    placed_on: row.order_placed_on,
    invoice_id: row.invoice_id,
    invoice_path: row.invoice_path,
    delivery_partner_name: row.delivery_partner_name,
    delivery_status_name: row.delivery_status_name,
  },
  buyer: {
    name: row.buyer_name || null,
    mobile_last4: row.buyer_mobile_last4 || null,
  },
  saree: {
    id: row.saree_id,
    title: row.saree_title,
    type_name: row.saree_type,
    color: row.saree_color,
    material: row.saree_material,
    border: row.saree_border,
    pallu: row.saree_pallu,
    blouse: row.saree_blouse,
    handloom: row.saree_handloom,
    combined_code: row.saree_code,
    dimension_length: row.saree_length,
    dimension_width: row.saree_width,
    description1: row.saree_description1,
    description2: row.saree_description2,
    img_directory: row.saree_img_directory,
  },
  suborder: {
    id: row.suborder_id,
    quantity: row.quantity,
    base_price: row.base_price,
  },
});

const checkQRCode = async (qrcode) => {
  try {
    await pool.query("BEGIN");

    const lookup = await pool.query(SELECT_QR_DETAILS, [qrcode]);

    if (0 === lookup.rows.length) {
      await pool.query("ROLLBACK");
      return {
        statuscode: 200,
        successstatus: true,
        verified: false,
        already_scanned: false,
        message: `Saree details not found for qrcode:${qrcode}! Please scan and try again.`,
        data: null,
      };
    }

    const row = lookup.rows[0];

    if (true === row.secrete_qrcode_check_status) {
      await pool.query("ROLLBACK");
      return {
        statuscode: 200,
        successstatus: true,
        verified: true,
        already_scanned: true,
        message:
          "This QR code has already been verified once at delivery. If this is your first time scanning it, the label may have been misused — please contact us immediately.",
        data: buildPayload(row),
      };
    }

    await pool.query(
      `UPDATE suborders
         SET secrete_qrcode_check_status = TRUE
       WHERE id = $1`,
      [row.suborder_id],
    );
    await pool.query("COMMIT");

    return {
      statuscode: 200,
      successstatus: true,
      verified: true,
      already_scanned: false,
      message:
        "Saree is verified and genuine. Thank you for your trust and purchase from my platform.",
      data: buildPayload(row),
    };
  } catch (err) {
    try { await pool.query("ROLLBACK"); } catch (_) {}
    return {
      statuscode: 500,
      successstatus: false,
      verified: false,
      already_scanned: false,
      message: `Error verifying QR code. Error: ${err.message}`,
    };
  }
};

module.exports = checkQRCode;
