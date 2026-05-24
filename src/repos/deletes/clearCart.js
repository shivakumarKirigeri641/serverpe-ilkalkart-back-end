const { connectDB } = require("../../database/connectDB");
const getCartItems = require("../gets/getCartItems");
const pool = connectDB();
const clearCart=async(ip_address, user_agent, user_id=null)=>{
    try {
        let result=[];
        await pool.query('BEGIN');
        if(user_id){
            let result = await pool.query(`select *from cart where user_id=$1`, [user_id]);
            if(0=== result.rows.length){
                    return {
                        statuscode: 404,
                        successstatus: false,
                        message: "Cart is empty!",
                        data: [],
                    }
                }
             result = await pool.query(`delete from cart where user_id=$1`, [user_id]);   
        }
        else{
            let result = await pool.query(`select *from cart where ip_address = $1 and user_agent=$2`, [ip_address, user_agent]);
            if(0=== result.rows.length){
                    return {
                        statuscode: 404,
                        successstatus: false,
                        message: "Cart is empty!",
                        data: [],
                    }
                }
            result = await pool.query(`delete from cart where ip_address=$1 and user_agent=$2`, [ip_address, user_agent]);   
        }    
        await pool.query('COMMIT');
        result = await getCartItems(ip_address, user_agent, user_id);
        return {
            statuscode: 200,
            successstatus: true,
            message: "Cart cleared successfully",
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
module.exports=clearCart