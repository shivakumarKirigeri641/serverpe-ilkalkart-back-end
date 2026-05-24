const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const getUserAndAddressDetails = async (mobile_number) => {
  let result_user_addresses = [];
  let result_user = await pool.query(
    `select *from users where mobile_number=$1`,
    [mobile_number],
  );
  if (0 < result_user.rows.length) {
    result_user_addresses = await pool.query(
      `select *from addresses where user_id=$1`,
      [result_user.rows[0].id],
    );
  }
  return {
    statuscode: 200,
    successstatus: true,
    message: "User details & addresses fetched successfully",
    data: {
      user_details: result_user.rows[0],
      user_addresses: result_user_addresses.rows,
    },
  };
};
module.exports = getUserAndAddressDetails;
