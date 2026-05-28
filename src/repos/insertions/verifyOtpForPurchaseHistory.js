const { connectDB } = require("../../database/connectDB");
const getPurchaseHistory = require("../gets/getPurchaseHistory");
const pool = connectDB();

const verifyOtpForPurchaseHistory = async (mobile_number, otp) => {
  try {
    await pool.query("BEGIN");
    await pool.query(`DELETE FROM otp_sessions WHERE expires_at < NOW()`);

    const match = await pool.query(
      `SELECT id FROM otp_sessions WHERE mobile_number = $1 AND otp = $2`,
      [mobile_number, otp],
    );
    if (0 === match.rows.length) {
      await pool.query("ROLLBACK");
      return {
        statuscode: 404,
        successstatus: false,
        message: "OTP expired or invalid. Please request a fresh OTP.",
        data: null,
      };
    }

    await pool.query(
      `DELETE FROM otp_sessions WHERE mobile_number = $1 AND otp = $2`,
      [mobile_number, otp],
    );
    await pool.query("COMMIT");

    const history = await getPurchaseHistory(mobile_number);
    return history;
  } catch (err) {
    try {
      await pool.query("ROLLBACK");
    } catch (_) {}
    return {
      statuscode: 500,
      successstatus: false,
      message: `Failed to verify OTP. Error: ${err.message}`,
    };
  }
};

module.exports = verifyOtpForPurchaseHistory;
