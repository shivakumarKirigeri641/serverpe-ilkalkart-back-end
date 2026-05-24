const validateForAddToCart = (req) => {
    //validate combined_code
    const { combined_code } = req.body;
    if (!combined_code) {
        return {
            statuscode: 400,
            successstatus: false,
            message: "combined_code is required",
        }
    }
    if (combined_code.length > 50) {
        return {
            statuscode: 400,
            successstatus: false,
            message: "combined_code should be less than 50 characters",
        }
    }    
    return {
        statuscode: 200,
        successstatus: true,
        message: "Combined code validated successfully",
    }
};
module.exports = validateForAddToCart;