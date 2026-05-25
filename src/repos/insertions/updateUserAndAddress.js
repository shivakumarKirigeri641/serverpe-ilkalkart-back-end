const { connectDB } = require("../../database/connectDB");
const pool = connectDB();
const updateUserAndAddress = async (
  user_name,
  mobile_number,
  email,
  addressData,
) => {
  try {
    await pool.query("BEGIN");
    let result_address = [];
    let result_user = await pool.query(
      `select *from users where mobile_number=$1`,
      [mobile_number],
    ); //ipaddress & user_agent
    if (0 === result_user.rows.length) {
      //new user
      //get user as user type
      const result_usertype = await pool.query(
        `select id from user_types where user_type_name='USER'`,
      );
      result_user = await pool.query(
        `insert into users (user_name, user_type_id, mobile_number, email) values ($1,$2,$3,$4) returning *`,
        [user_name, result_usertype.rows[0].id, mobile_number, email],
      );
    }
    //addresses
    if (addressData?.id) {
      //update
      result_address = await pool.query(
        `UPDATE addresses
SET
    user_id = $1,
    state_union_id = $2,
    house_flat_no = $3,
    address_line1 = $4,
    address_line2 = $5,
    area = $6,
    landmark = $7,
    pincode = $8,
    city = $9,
    district = $10,
    map_location = $11
WHERE id = $12;`,
        [
          result_user.rows[0].id,
          addressData.state_union_id,
          addressData.house_flat_no,
          addressData.address_line1,
          addressData.address_line2,
          addressData.area,
          addressData.landmark,
          addressData.pincode,
          addressData.city,
          addressData.district,
          addressData.map_location,
          addressData.id,
        ],
      );
    } else {
      //insert
      result_address = await pool.query(
        `INSERT INTO addresses (
        user_id,
        state_union_id,
        house_flat_no,
        address_line1,
        address_line2,
        area,
        landmark,
        pincode,
        city,
        district,
        map_location,
        is_default
    )
    VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,true
    )
    RETURNING *;`,
        [
          result_user.rows[0].id,
          addressData.state_union_id,
          addressData.house_flat_no,
          addressData.address_line1,
          addressData.address_line2,
          addressData.area,
          addressData.landmark,
          addressData.pincode,
          addressData.city,
          addressData.district,
          addressData.map_location,
        ],
      );
    }
    await pool.query("COMMIT");
    return {
      statuscode: 201,
      powered_by: "ServerPe App Solutions",
      successstatus: true,
      message: `user detials & address update successfull.`,
      data: {
        user_details: result_user.rows[0],
        user_address: result_address.rows[0],
      },
    };
  } catch (err) {
    await pool.query("ROLLBACK");
    return {
      statuscode: 500,
      powered_by: "ServerPe App Solutions",
      successstatus: false,
      message: `Failed to update user details & address`,
    };
  }
};
module.exports = updateUserAndAddress;
