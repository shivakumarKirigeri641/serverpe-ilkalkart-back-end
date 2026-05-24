const { connectDB } = require("../../database/connectDB");
const getCartItems = require("../gets/getCartItems");
const pool = connectDB();
const addToCart=async(ip_address, user_agent, combined_code, user_id = null)=>{
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
            if(result.rows.length > 0){
                result = await pool.query(`update cart set quantity =$1 where user_id=$2 and inventory_element_id=$3`, [result.rows[0].quantity + 1, user_id, id]);
            }
            else{
                result = await pool.query(`insert into cart (ip_address, user_agent, inventory_element_id, user_id) values ($1, $2, $3, $4) returning *`, [ip_address, user_agent, combined_code, user_id]);
            }
        }
        else{
            let result = await pool.query(`select *from cart where ip_address = $1 and user_agent=$2 and inventory_element_id=$3`, [ip_address, user_agent, id]);
            if(result.rows.length > 0){
                result = await pool.query(`update cart set quantity =$1 where ip_address=$2 and user_agent=$3 and inventory_element_id=$4`, [result.rows[0].quantity + 1, ip_address, user_agent, id]);
            }
            else{
                result = await pool.query(`insert into cart (ip_address, user_agent, inventory_element_id, user_id) values ($1, $2, $3, $4)`, [ip_address, user_agent, id, user_id]);
            }                        
        }
        await pool.query('COMMIT');
        result = await getCartItems(ip_address, user_agent, user_id);
        return {
            statuscode: 200,
            successstatus: true,
            message: "Cart item added successfully",
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
module.exports=addToCart