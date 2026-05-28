const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const getQueryTypes = require("../repos/gets/getQueryTypes");
const getFeedbacks = require("../repos/gets/getFeedbacks");
const validateForMobileNumber = require("../validators/validateForMobileNumber");
const validateForTrackMySaree = require("../validators/validateForTrackMySaree");
const validateForFeedback = require("../validators/validateForFeedback");
const validateForContactMe = require("../validators/validateForContactMe");
const getProducts = require("../repos/gets/getProducts");
const getOfferDetails = require("../repos/gets/getOfferDetails");
const getGSTValue = require("../repos/gets/getGSTValue");
const getStatesAndUnions = require("../repos/gets/getStatesAndUnions");
const getAddresses = require("../repos/gets/getAddresses");
const trackOrder = require("../repos/gets/trackOrder");
const postFeedback = require("../repos/insertions/postFeedback");
const postContactMe = require("../repos/insertions/postContactMe");
const checkQRCode = require("../repos/checks/checkQRCode");
const getRequestDetails = require("../utils/getRequestDetails");
const sendOtpForPurchaseHistory = require("../repos/insertions/sendOtpForPurchaseHistory");
const verifyOtpForPurchaseHistory = require("../repos/insertions/verifyOtpForPurchaseHistory");
const {
  readLimiter,
  writeLimiter,
  sensitiveLimiter,
} = require("../utils/rateLimiters");

const FEEDBACK_PICS_DIR = path.join(
  __dirname,
  "..",
  "uploads",
  "feedback_pics",
);
if (!fs.existsSync(FEEDBACK_PICS_DIR)) {
  fs.mkdirSync(FEEDBACK_PICS_DIR, { recursive: true });
}
const feedbackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, FEEDBACK_PICS_DIR),
  filename: (_req, file, cb) => {
    const ext = path
      .extname(file.originalname || "")
      .toLowerCase()
      .slice(0, 8);
    const safeExt = /^\.(jpg|jpeg|png|webp|gif)$/.test(ext) ? ext : ".jpg";
    cb(null, `fb_${Date.now()}_${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});
const feedbackUpload = multer({
  storage: feedbackStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file) return cb(null, true);
    if (/^image\/(jpe?g|png|webp|gif)$/.test(file.mimetype))
      return cb(null, true);
    cb(new Error("Only JPG/PNG/WEBP/GIF images are allowed"));
  },
});

const publicRotuer = express.Router();
publicRotuer.get("/query-types", readLimiter, async (req, res) => {
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
publicRotuer.get("/products", readLimiter, async (req, res) => {
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
publicRotuer.get("/offers", readLimiter, async (req, res) => {
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
publicRotuer.get("/gst-value", readLimiter, async (req, res) => {
  try {
    const result = await getGSTValue();
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
publicRotuer.get("/states-unions", readLimiter, async (req, res) => {
  try {
    const result = await getStatesAndUnions();
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
publicRotuer.post("/addresses", sensitiveLimiter, async (req, res) => {
  try {
    let result = validateForMobileNumber(req);
    if (false === result.successstatus) {
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    }
    result = await getAddresses(req.body.mobile_number);
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
publicRotuer.post("/track-my-saree", sensitiveLimiter, async (req, res) => {
  try {
    let result = validateForTrackMySaree(req);
    if (false === result.successstatus) {
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    }
    result = await trackOrder(req.body.order_id);
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
publicRotuer.get("/feedbacks", readLimiter, async (req, res) => {
  try {
    const result = await getFeedbacks();
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
publicRotuer.post(
  "/feedback",
  writeLimiter,
  (req, res, next) => {
    feedbackUpload.single("pic")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          statuscode: 400,
          powered_by: "ServerPe App Solutions",
          successstatus: false,
          message: err.message || "Image upload failed",
        });
      }
      next();
    });
  },
  async (req, res) => {
    const cleanupUploadedFile = () => {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
    };
    try {
      const validation = validateForFeedback(req);
      if (false === validation.successstatus) {
        cleanupUploadedFile();
        return res.status(validation.statuscode).json({
          statuscode: validation.statuscode,
          powered_by: "ServerPe App Solutions",
          successstatus: validation.successstatus,
          message: validation.message,
        });
      }
      const picPath = req.file
        ? `uploads/feedback_pics/${req.file.filename}`
        : null;
      const result = await postFeedback(
        req.body.user_name,
        Number(req.body.rating),
        req.body.message || null,
        picPath,
      );
      if (!result.successstatus) cleanupUploadedFile();
      return res.status(result.statuscode).json({
        statuscode: result.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: result.successstatus,
        message: result.message,
        data: result.data,
      });
    } catch (err) {
      cleanupUploadedFile();
      return res.status(500).json({
        statuscode: 500,
        powered_by: "ServerPe App Solutions",
        successstatus: false,
        message: `Internal server error. Error:${err.message}`,
      });
    }
  },
);
publicRotuer.post("/contact-me", writeLimiter, async (req, res) => {
  try {
    const validation = validateForContactMe(req);
    if (false === validation.successstatus) {
      return res.status(validation.statuscode).json({
        statuscode: validation.statuscode,
        powered_by: "ServerPe App Solutions",
        successstatus: validation.successstatus,
        message: validation.message,
      });
    }
    const result = await postContactMe(
      req.body.user_name,
      req.body.mobile_number,
      req.body.query_type_name,
      req.body.message,
      req.body.email,
    );
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
publicRotuer.post(
  "/purchase-history/send-otp",
  sensitiveLimiter,
  async (req, res) => {
    try {
      let result = validateForMobileNumber(req);
      if (false === result.successstatus) {
        return res.status(result.statuscode).json({
          statuscode: result.statuscode,
          powered_by: "ServerPe App Solutions",
          successstatus: result.successstatus,
          message: result.message,
          data: result.data,
        });
      }
      result = await sendOtpForPurchaseHistory(result.data.mobile_number);
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
  },
);

publicRotuer.post(
  "/purchase-history/verify-otp",
  sensitiveLimiter,
  async (req, res) => {
    try {
      const mobileResult = validateForMobileNumber(req);
      if (false === mobileResult.successstatus) {
        return res.status(mobileResult.statuscode).json({
          statuscode: mobileResult.statuscode,
          powered_by: "ServerPe App Solutions",
          successstatus: mobileResult.successstatus,
          message: mobileResult.message,
          data: mobileResult.data,
        });
      }
      const otp = String(req.body?.otp || "").trim();
      if (!/^\d{4}$/.test(otp)) {
        return res.status(400).json({
          statuscode: 400,
          powered_by: "ServerPe App Solutions",
          successstatus: false,
          message: "Please enter the 4-digit OTP",
          data: null,
        });
      }
      const result = await verifyOtpForPurchaseHistory(
        mobileResult.data.mobile_number,
        otp,
      );
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
  },
);
publicRotuer.post("/qrcode", sensitiveLimiter, async (req, res) => {
  try {
    const qrcode = String(req.body?.qrcode || "").trim();
    if (!qrcode) {
      return res.status(400).json({
        statuscode: 400,
        powered_by: "ServerPe App Solutions",
        successstatus: false,
        message: "qrcode is required in request body",
        data: null,
      });
    }
    const reqDetails = await getRequestDetails(req).catch(() => ({}));
    const scanCtx = {
      ip_address: reqDetails.ipAddress || null,
      user_agent: req.headers["user-agent"] || null,
      device_name: reqDetails.devicename || null,
    };
    const result = await checkQRCode(qrcode, scanCtx);
    return res.status(result.statuscode).json({
      statuscode: result.statuscode,
      powered_by: "ServerPe App Solutions",
      successstatus: result.successstatus,
      verified: result.verified,
      already_scanned: result.already_scanned,
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
module.exports = publicRotuer;
