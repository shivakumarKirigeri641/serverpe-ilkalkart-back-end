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

/* 🛡️ Global rate-limit — blunt protection against scraping / looping bots */
app.use(globalLimiter);

/* ✅ CORS for cross-subdomain cookies */
/*app.use(
  cors({
    origin: ["https://serverpe.in", "https://admin.serverpe.in"],
    credentials: true,
  }),
);*/
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());

/* Static files */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
