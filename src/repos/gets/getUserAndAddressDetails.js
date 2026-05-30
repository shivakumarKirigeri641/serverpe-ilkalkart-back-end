const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const getUserAndAddressDetails = async (
  mobile_number,
  need_default = false,
) => {
  let result_user_addresses = [];
  let result_user = await pool.query(
    `select *from users where mobile_number=$1`,
    [mobile_number],
  );
  if (0 < result_user.rows.length) {
    result_user_addresses = await pool.query(
      true === need_default
        ? `select *from addresses where user_id=$1 and is_active=true and is_default=true`
        : `select *from addresses where user_id=$1 and is_active=true`,
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
