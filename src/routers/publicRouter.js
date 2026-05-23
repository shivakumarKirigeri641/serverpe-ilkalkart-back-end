const express = require("express");
const getQueryTypes = require("../repos/gets/getQueryTypes");
const getSareePhotos = require("../repos/gets/getSareePhotos");
const getProducts = require("../repos/gets/getProducts");
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

publicRotuer.get("/test/saree-photos/:sareeId/:colorCode", async (req, res) => {
  try {
    const { sareeId, colorCode } = req.params;
    const result = await getSareePhotos(req, 1, colorCode);
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
module.exports = publicRotuer;
