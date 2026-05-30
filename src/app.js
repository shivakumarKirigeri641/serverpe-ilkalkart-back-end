const express = require("express");
const path = require("path");
const cors = require("cors");
const publicRouter = require("./routers/publicRouter");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { connectDB } = require("./database/connectDB");
const publicCartModificationsRouter = require("./routers/publicCartModificationsRouter");
const publicPayRouter = require("./routers/publicPayRouter");
const sweepStaleReservations = require("./repos/jobs/sweepStaleReservations");
const { globalLimiter } = require("./utils/rateLimiters");
const PORT = process.env.PORT;
const app = express();

/* 🔐 MUST be before CORS & cookies */
app.set("trust proxy", 1);
app.use(express.json());

/* ✅ CORS for cross-subdomain cookies */
/*app.use(
  cors({
    origin: ["https://serverpe.in", "https://admin.serverpe.in"],
    credentials: true,
  }),
);*/
const allowedOrigins = [
  "https://ilkalkart.in",
  "https://www.ilkalkart.in",
  "http://localhost:5173", // local dev
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());

/* Static files — NOT rate-limited (images load freely) */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* 🛡️ Global rate-limit — applies only to API routes, not to /uploads */
app.use("/ik/customer/", globalLimiter);

/* Routes */
app.use("/ik/customer/", publicRouter);
app.use("/ik/customer/", publicCartModificationsRouter);
app.use("/ik/customer/", publicPayRouter);
/* DB connections */
connectDB();

const RESERVATION_SWEEP_INTERVAL_MS =
  Number(process.env.RESERVATION_SWEEP_INTERVAL_MIN || 5) * 60 * 1000;
setInterval(() => {
  sweepStaleReservations().catch(() => {});
}, RESERVATION_SWEEP_INTERVAL_MS);

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
