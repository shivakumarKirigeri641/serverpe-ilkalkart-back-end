const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const generateInvoiceId = async () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const formattedDate = `${yyyy}${mm}${dd}`;
  // ==========================================
  // GET TODAY ORDER COUNT FROM DB
  // ==========================================

  const query = `SELECT COUNT(*) + 1 AS next_count from invoices WHERE created_at::date = CURRENT_DATE`;
  const countResult = await pool.query(query);
  const nextCount = String(countResult.rows[0].next_count);
  // ==========================================
  // FINAL ORDER ID
  // ==========================================
  const invoiceId = `INV-${formattedDate}-${nextCount}`;
  return invoiceId;
};
module.exports = generateInvoiceId;
