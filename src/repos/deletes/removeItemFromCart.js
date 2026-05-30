const { connectDB } = require("../../database/connectDB");
const getCartItems = require("../gets/getCartItems");
const pool = connectDB();
const removeItemFromCart=async(ip_address, user_agent, combined_code, user_id = null)=>{
    try {
        let result=[];
        await pool.query('BEGIN');
        let result_saree_element = await pool.query(`select *from inventory_elements where combined_code=$1`, [combined_code]);
        if(result_saree_element.rows.length == 0){
            return {
                statuscode: 404,
                successstatus: false,
                message: "Saree element not found",
                data: [],
            }
        }
        let id = result_saree_element.rows[0].id;
        if(user_id){
            let result = await pool.query(`select *from cart where user_id=$1 and inventory_element_id=$2`, [user_id, id]);
            if(0=== result.rows.length){
                return {
                    statuscode: 404,
                    successstatus: false,
                    message: "Saree element not found",
                    data: [],
                }
            }
            result = await pool.query(`delete from cart where user_id=$1 and inventory_element_id=$2`, [user_id, id]);   
        }
        else{
            let result = await pool.query(`select *from cart where ip_address = $1 and user_agent=$2 and inventory_element_id=$3`, [ip_address, user_agent, id]);
            if(0=== result.rows.length){
                return {
                    statuscode: 404,
                    successstatus: false,
                    message: "Saree element not found",
                    data: [],
                }
            }
            result = await pool.query(`delete from cart where ip_address=$1 and user_agent=$2 and inventory_element_id=$3`, [ip_address, user_agent, id]);   
        }
        await pool.query('COMMIT');
        result = await getCartItems(ip_address, user_agent, user_id);
        return {
            statuscode: 200,
            successstatus: true,
            message: "Cart item removed successfully",
            data: result?.data,
        }
    } catch (error) {
        await pool.query('ROLLBACK');
        return {
            statuscode: 500,
            successstatus: false,
            message: `Internal server error. Error:${error.message}`,
        }
    }
    
}
module.exports=removeItemFromCart