const validateForTrackMySaree = (req) => {
  //validate combined_code
  const { order_id } = req.body;
  if (!order_id) {
    return {
      statuscode: 400,
      successstatus: false,
      message: "order_id is required",
    };
  }
  if (order_id.length > 50) {
    return {
      statuscode: 400,
      successstatus: false,
      message: "order_id should be less than 50 characters",
    };
  }
  return {
    statuscode: 200,
    successstatus: true,
    message: "order_id validated successfully",
  };
};
module.exports = validateForTrackMySaree;
