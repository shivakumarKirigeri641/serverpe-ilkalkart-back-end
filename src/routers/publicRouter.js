const express = require("express");
const publicRotuer = express.Router();
publicRotuer.get("/query-types", async (req, res) => {
  res.json({ test: "ok" });
});
module.exports = publicRotuer;
