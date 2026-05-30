const { connectDB } = require("../../database/connectDB");
const getCartProductListQuery = require("../../utils/getCartProductListQuery");
const pool = connectDB();
const getCartItems = async (ip_address, user_agent, user_id = null) => {
  const result = user_id
    ? await pool.query(getCartProductListQuery(user_id), [user_id])
    : await pool.query(getCartProductListQuery(), [ip_address, user_agent]);
  const data = result.rows.length > 0 ? result.rows[0].data : [];
  if (data && Array.isArray(data.items)) {
    data.items.sort((a, b) =>
      String(a.combined_code || "").localeCompare(String(b.combined_code || ""))
    );
  }
  return {
    statuscode: 200,
    successstatus: true,
    message: "Cart items fetched successfully",
    data,
  };
};
module.exports = getCartItems;
