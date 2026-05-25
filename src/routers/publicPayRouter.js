const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const validateForSendOtpLogin = require("../validators/validateForSendOtpLogin");
const validateForVerifyOtpLogin = require("../validators/validateForVerifyOtpLogin");
const insertPaymentAndOrder = require("../repos/insertions/insertPaymentOrdersAndInvoices");
const insertPaymentFailure = require("../repos/insertions/insertPaymentFailure");
const reserveInventoryForOrder = require("../repos/insertions/reserveInventoryForOrder");
const insertOtpForSubscription = require("../repos/insertions/insertOtpForSubscription");
const verifyOtpForLogin = require("../repos/insertions/verifyOtpForLogin");
const updateUserAndAddress = require("../repos/insertions/updateUserAndAddress");
const getCartItems = require("../repos/gets/getCartItems");
const getRequestDetails = require("../utils/getRequestDetails");
const getUserAndAddressDetails = require("../repos/gets/getUserAndAddressDetails");
const insertPayment = require("../repos/insertions/insertPaymentOrdersAndInvoices");
const generateOrderId = require("../repos/gets/generateOrderId");
const generateInvoiceId = require("../repos/gets/generateInvoiceId");
const insertOrders = require("../repos/insertions/insertOrders");
const insertPaymentOrdersAndInvoices = require("../repos/insertions/insertPaymentOrdersAndInvoices");
const publicPayRouter = express.Router();
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// ======================================================
//    RAZORPAY - CREATE ORDER
// ======================================================
publicPayRouter.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, user_name, mobile_number, address_id, email } =
      req.body;
    const { ipAddress, devicename } = await getRequestDetails(req);
    const result_userwithaddresses =
      await getUserAndAddressDetails(mobile_number);
    const result_cartitems = await getCartItems(ipAddress, devicename);
    if (!amount || amount <= 0) {
      return res.status(400).json({
        statuscode: 400,
        successstatus: false,
        message: "Invalid amount.",
      });
    }
    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: currency || "INR",
      receipt: `sr_${result_cartitems?.data.items.length}v_${Date.now()}`,
      notes: {
        user_id: result_userwithaddresses.data.user_details.id,
        saree_count: String(result_cartitems?.data.items.length),
        type: "saree_order",
      },
    };
    const order = await razorpay.orders.create(options);

    const userId = result_userwithaddresses?.data?.user_details?.id || null;
    const reservation = await reserveInventoryForOrder(
      order.id,
      ipAddress,
      devicename,
      userId,
    );
    if (!reservation.successstatus) {
      try {
        await insertPaymentFailure(
          {
            razorpay_order_id: order.id,
            amount,
            currency: currency || "INR",
            status: "reservation_failed",
            contact: mobile_number || null,
            reason:
              reservation.statuscode === 409
                ? "out_of_stock"
                : "reservation_error",
            source: "server",
          },
          order.id,
        );
      } catch (_) { /* best-effort cleanup */ }
      return res.status(reservation.statuscode).json({
        statuscode: reservation.statuscode,
        successstatus: false,
        message: reservation.message,
        data: reservation.data || null,
      });
    }

    return res.status(200).json({
      statuscode: 200,
      successstatus: true,
      message: "Order created successfully.",
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        key_id: process.env.RAZORPAY_KEY_ID,
        user_id: result_userwithaddresses.data.user_details.id,
      },
    });
  } catch (err) {
    console.error("Razorpay create order error:", err);
    return res.status(500).json({
      statuscode: 500,
      successstatus: false,
      error: "Internal Server Error",
      message: err.message,
    });
  }
});
// ======================================================
//    RAZORPAY - VERIFY PAYMENT
// ======================================================
publicPayRouter.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mobile_number,
      amount,
      price_per_set,
      gst_percentage,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        statuscode: 400,
        successstatus: false,
        message: "Missing payment verification fields.",
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        statuscode: 400,
        successstatus: false,
        message: "Payment verification failed. Invalid signature.",
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    const paymentData = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: payment.amount / 100,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      email: payment.email,
      contact: payment.contact,
      paid_at: new Date(),
    };
    //first insert payment data
    const { ipAddress, devicename } = await getRequestDetails(req);
    const result_userdetailsandaddress = await getUserAndAddressDetails(
      mobile_number,
      true,
    );
    const result_cartitems = await getCartItems(ipAddress, devicename);
    const result_masterdetails = await insertPaymentOrdersAndInvoices(
      paymentData,
      ipAddress,
      devicename,
      result_cartitems,
      result_userdetailsandaddress?.data,
    );
    if (!result_masterdetails?.successstatus) {
      return res.status(result_masterdetails?.statuscode || 500).json({
        statuscode: result_masterdetails?.statuscode || 500,
        successstatus: false,
        message: result_masterdetails?.message || "Failed to persist order.",
      });
    }
    return res.status(200).json({
      statuscode: 200,
      successstatus: true,
      message: "Payment verified and order placed.",
      data: result_masterdetails.data,
    });
  } catch (err) {
    console.error("Razorpay verify QR sticker payment error:", err);
    return res.status(500).json({
      statuscode: 500,
      successstatus: false,
      error: "Internal Server Error",
      message: err.message,
    });
  }
});
// ======================================================
//    RAZORPAY - PAYMENT FAILURE / CANCEL / ABANDON
// ======================================================
// Accepts both application/json (normal failure/cancel) and text/plain
// (used by navigator.sendBeacon when the browser tab is being closed).
publicPayRouter.post(
  "/payment-failure",
  express.text({ type: ["text/plain", "application/octet-stream"] }),
  async (req, res) => {
    try {
      let payload = req.body;
      if (typeof payload === "string" && payload.length > 0) {
        try {
          payload = JSON.parse(payload);
        } catch {
          payload = {};
        }
      }
      payload = payload || {};

      const failureData = {
        razorpay_order_id: payload.razorpay_order_id || null,
        razorpay_payment_id: payload.razorpay_payment_id || null,
        amount: payload.amount || 0,
        currency: payload.currency || "INR",
        method: payload.method || null,
        status: payload.status || "failed",
        email: payload.email || null,
        contact: payload.mobile_number || payload.contact || null,
        reason: payload.reason || "unknown",
        source: payload.source || "client",
      };

      const result = await insertPaymentFailure(
        failureData,
        failureData.razorpay_order_id,
      );
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        successstatus: result.successstatus,
        message: result.message,
        data: result.data || null,
      });
    } catch (err) {
      console.error("Razorpay payment-failure error:", err);
      return res.status(500).json({
        statuscode: 500,
        successstatus: false,
        message: err.message,
      });
    }
  },
);
// ======================================================
//                USER-SEND-OTP
// ======================================================
publicPayRouter.post("/send-otp", async (req, res) => {
  try {
    let result = validateForSendOtpLogin(req);
    if (false === result.successstatus) {
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    }
    //send otp
    const otp = "6416";
    result = await insertOtpForSubscription(req.body.mobile_number, otp);
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
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
// ======================================================
//                USER-VERIFY-OTP
// ======================================================
publicPayRouter.post("/verify-otp", async (req, res) => {
  try {
    const ipAddress =
      (req.headers["x-forwarded-for"] &&
        req.headers["x-forwarded-for"].split(",")[0]) ||
      req.socket?.remoteAddress ||
      null;
    const user_agent = req.headers["user-agent"];
    let result = validateForVerifyOtpLogin(req); //address details, user details included here.
    if (false === result.successstatus) {
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    }
    //verify otp
    result = await verifyOtpForLogin(
      req.body.mobile_number,
      req.body.otp,
      ipAddress,
      user_agent,
    );
    if (false === result.successstatus) {
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    }
    //create token
    /*const v_token = generateTokenForVehicleOwner(
      result?.data?.user_details?.id,
      result?.data?.logger_details.id,
    );*/
    /*res.cookie("v_token", v_token, {
        httpOnly: true,
        secure: true, // REQUIRED for SameSite=None
        sameSite: "None", // REQUIRED for cross-domain React → Node
        domain: ".serverpe.in",
      });*/
    /*res.cookie("v_token", v_token, {
      httpOnly: true,
      secure: false, // must be false because you're not using HTTPS
      sameSite: "lax", // must be lax or strict on localhost
      maxAge: 10 * 60 * 1000,
    });*/
    //insert into user
    //insert into address.
    const result_userdetailsandaddress = await updateUserAndAddress(
      req.body.user_name,
      req.body.mobile_number,
      req.body.email,
      req.body.address,
    );
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      message: result.message,
      data: {
        ...(result?.data || {}),
        user_details: result_userdetailsandaddress?.data?.user_details || null,
        user_address: result_userdetailsandaddress?.data?.user_address || null,
      },
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
module.exports = publicPayRouter;
