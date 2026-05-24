const express = require("express");
const getQueryTypes = require("../repos/gets/getQueryTypes");
const addToCart = require("../repos/insertions/addToCart");
const validateForAddToCart = require("../validators/validateForAddToCart");
const getRequestDetails = require('../utils/getRequestDetails');
const getProducts = require("../repos/gets/getProducts");
const getOfferDetails = require("../repos/gets/getOfferDetails");
const getCartItems = require("../repos/gets/getCartItems");
const reduceItemFromCart = require("../repos/deletes/reduceItemFromCart");
const publicRotuer = express.Router();
publicRotuer.get("/query-types", async (req, res) => {
  try {
    const result = await getQueryTypes();
    /*let { ipAddress, visitTime, devicename, result_ipdetails } =
      await getRequestDetails(req);
    await sendMail({
      to: process.env.ADMINMAIL,
      subject: "An user landing page visit alert",
      html: userVisitLandingPageAlertTemplate({
        ipAddress,
        visitTime,
        devicename,
        result_ipdetails,
      }),
      text: "Alert! User visited landing page",
    });*/
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
publicRotuer.get("/products", async (req, res) => {
  try {
    const result = await getProducts();
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
publicRotuer.get("/offers", async (req, res) => {
  try {
    const result = await getOfferDetails();
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
publicRotuer.get("/cart-items", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } = await getRequestDetails(req);
    const result = await getCartItems(ipAddress, devicename);
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
      data:result.data,
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
publicRotuer.post("/add-to-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } = await getRequestDetails(req);    
    let result = validateForAddToCart(req);
    if(true === result.successstatus){
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
publicRotuer.post("/remove-from-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } = await getRequestDetails(req);
    
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
publicRotuer.put("/reduce-item-from-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } = await getRequestDetails(req);    
    let result = validateForAddToCart(req);
    if(true === result.successstatus){
      result = await reduceItemFromCart(ipAddress, devicename, req.body.combined_code);
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
publicRotuer.post("/clear-cart", async (req, res) => {
  try {
    let { ipAddress, visitTime, devicename, result_ipdetails } = await getRequestDetails(req);
    
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
module.exports = publicRotuer;
