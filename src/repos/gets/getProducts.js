const { connectDB } = require("../../database/connectDB");
const getProductsQuery = require("../../utils/getProductsQuery");
const pool = connectDB();
const getProducts = async () => {
  try {
    const result = await pool.query(getProductsQuery());
    return {
      statuscode: 200,
      successstatus: true,
      message: "Products fetched successfully",
      data: result.rows.length > 0 ? result.rows[0].result || [] : [],
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching query types. Error: ${err.message}`,
    };
  }
};

module.exports = getProducts;
