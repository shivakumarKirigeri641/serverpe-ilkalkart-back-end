const express = require("express");
const path = require("path");
const cors = require("cors");
const publicRotuer = require("./routers/publicRouter");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { connectDB } = require("./database/connectDB");
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
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());

/* Static files */

/* Routes */
app.use("/ik/customer/", publicRotuer);
/* DB connections */
connectDB();

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
