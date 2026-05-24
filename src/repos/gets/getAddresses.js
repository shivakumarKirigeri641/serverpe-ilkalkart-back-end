const { connectDB } = require("../../database/connectDB");
const pool = connectDB();

const getAddresses = async (mobile_number) => {
  try {
    let result_addresses = [];
    const result_user = await pool.query(
      `select *from users where mobile_number=$1;`,
      [mobile_number],
    );
    if (0 < result_user.rows.length) {
      result_addresses = await pool.query(
        `select *from addresses where user_id=$1 order by id`,
        [result_user.rows[0].id],
      );
    }
    return {
      statuscode: 200,
      successstatus: true,
      message: "GST value details fetched successfully",
      data: {
        user_details: result_user.rows.length > 0 ? result_user.rows[0] : {},
        user_addresses: result_addresses.rows,
      },
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching offers. Error: ${err.message}`,
    };
  }
};

module.exports = getAddresses;
