const express = require("express");
const addToCart = require("../repos/insertions/addToCart");
const validateForItemInCart = require("../validators/validateForItemInCart");
const getRequestDetails = require("../utils/getRequestDetails");
const getCartItems = require("../repos/gets/getCartItems");
const reduceItemFromCart = require("../repos/deletes/reduceItemFromCart");
const removeItemFromCart = require("../repos/deletes/removeItemFromCart");
const clearCart = require("../repos/deletes/clearCart");
const publicCartModificationsRouter = express.Router();
/*
--------------GET CART ITEMS--------------
 */
publicCartModificationsRouter.get("/cart-items", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } =
      await getRequestDetails(req);
    const result = await getCartItems(ipAddress, devicename);
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      statuscode: 500,
      powered_by: "ServerPe App Solutions",
      successstatus: false,
      message: `Internal server error. Error:${err.message}`,
    });
  } finally {
  }
});
/*
--------------ADD ITEMS TO CART--------------
 */
publicCartModificationsRouter.post("/add-to-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } =
      await getRequestDetails(req);
    let result = validateForItemInCart(req);
    if (true === result.successstatus) {
      result = await addToCart(ipAddress, devicename, req.body.combined_code);
    }
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      statuscode: 500,
      powered_by: "ServerPe App Solutions",
      successstatus: false,
      message: `Internal server error. Error:${err.message}`,
    });
  } finally {
  }
});
/*
--------------REMOVE ITEM FROM CART--------------
 */
publicCartModificationsRouter.delete(
  "/remove-item-from-cart",
  async (req, res) => {
    try {
      let { ipAddress, visitTime, devicename, result_ipdetails } =
        await getRequestDetails(req);
      let result = validateForItemInCart(req);
      if (true === result.successstatus) {
        result = await removeItemFromCart(
          ipAddress,
          devicename,
          req.body.combined_code,
        );
      }
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      return res.status(500).json({
        statuscode: 500,
        powered_by: "ServerPe App Solutions",
        successstatus: false,
        message: `Internal server error. Error:${err.message}`,
      });
    } finally {
    }
  },
);
/*
--------------REDUCE QUANTITY OF AN ITEM FROM CART--------------
 */
publicCartModificationsRouter.put(
  "/reduce-item-from-cart",
  async (req, res) => {
    try {
      let { ipAddress, visitTime, devicename, result_ipdetails } =
        await getRequestDetails(req);
      let result = validateForItemInCart(req);
      if (true === result.successstatus) {
        result = await reduceItemFromCart(
          ipAddress,
          devicename,
          req.body.combined_code,
        );
      }
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      return res.status(500).json({
        statuscode: 500,
        powered_by: "ServerPe App Solutions",
        successstatus: false,
        message: `Internal server error. Error:${err.message}`,
      });
    } finally {
    }
  },
);
/*
--------------CLEAR THE CART COMPLETELY--------------
 */
publicCartModificationsRouter.delete("/clear-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } =
      await getRequestDetails(req);
    let result = await clearCart(ipAddress, devicename);
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    return res.status(500).json({
      statuscode: 500,
      powered_by: "ServerPe App Solutions",
      successstatus: false,
      message: `Internal server error. Error:${err.message}`,
    });
  } finally {
  }
});
/*
--------------PAY--------------
 */

module.exports = publicCartModificationsRouter;
