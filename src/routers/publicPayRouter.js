const express = require("express");
const Razorpay = require("razorpay");
const validateForSendOtpLogin = require("../validators/validateForSendOtpLogin");
const validateForVerifyOtpLogin = require("../validators/validateForVerifyOtpLogin");
const insertPaymentAndOrder = require("../repos/insertions/insertPaymentAndOrder");
const insertOtpForSubscription = require("../repos/insertions/insertOtpForSubscription");
const verifyOtpForLogin = require("../repos/insertions/verifyOtpForLogin");
const updateUserAndAddress = require("../repos/insertions/updateUserAndAddress");
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
    const { amount, currency, user_name, mobile_number, addressData, email } =
      req.body;
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
      receipt: `sr_${result.rows.length}v_${Date.now()}`,
      notes: {
        user_id,
        saree_count: String(result.rows.length),
        type: "saree_order",
      },
    };
    //check for out-of-stock for any saree details, if out of stock throw the error. do not proceed with payment
    const order = await razorpay.orders.create(options);
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
        user_id,
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
      user_id,
      address_id,
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

    //1. insert/get user details
    //2.
    if (!result.successstatus) {
      return res.status(result.statuscode).json(result);
    }

    return res.status(200).json({
      statuscode: 200,
      successstatus: true,
      message: "Payment verified and order placed.",
      data: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        paid_at: new Date().toISOString(),
        payment: result.data.payment,
        invoice: result.data.invoice,
        sticker_orders: result.data.sticker_orders,
      },
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
      data: result?.data,
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
