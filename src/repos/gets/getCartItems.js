const { connectDB } = require("../../database/connectDB");
const getCartProductListQuery = require("../../utils/getCartProductListQuery");
const pool = connectDB();
const getCartItems = async (ip_address, user_agent, user_id = null) => {
    if (user_id) {
        const result = await pool.query(getCartProductListQuery(user_id), [user_id]);
        return {
            statuscode: 200,
            successstatus: true,
            message: "Cart items fetched successfully",
            data: result.rows.length>0?result.rows[0].data:[],
        }
    }
    else {
        const result = await pool.query(getCartProductListQuery(), [ip_address, user_agent]);
        return {
            statuscode: 200,
            successstatus: true,
            message: "Cart items fetched successfully",
            data: result.rows.length>0?result.rows[0].data:[],
        }
    }
};
module.exports = getCartItems;