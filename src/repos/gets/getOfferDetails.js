const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const getOfferDetails = async () => {
  try {
    const result = await pool.query(
      `SELECT title, description, offer_percent_value
       FROM offers
       WHERE is_active = true
       ORDER BY offer_percent_value DESC;`
    );
    return {
      statuscode: 200,
      successstatus: true,
      message: "Product offers fetched successfully",
      data: result.rows,
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching offers. Error: ${err.message}`,
    };
  }
};

module.exports = getOfferDetails;
