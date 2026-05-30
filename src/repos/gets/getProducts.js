const fs = require("fs");
const path = require("path");
const { connectDB } = require("../../database/connectDB");
const getProductsQuery = require("../../utils/getProductsQuery");

const pool = connectDB();
const UPLOADS_ROOT = path.join(__dirname, "..", "..", "uploads");

const listJpgFiles = async (urlDir) => {
  if (!urlDir) return [];
  const rel = String(urlDir).replace(/^\/+/, "").replace(/^uploads\/?/i, "");
  const absDir = path.join(UPLOADS_ROOT, rel);
  try {
    const files = await fs.promises.readdir(absDir);
    const urlPrefix = `/uploads/${rel.replace(/\/+$/, "")}`;
    return files
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort()
      .map((f) => `${urlPrefix}/${f}`);
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
};

const getProducts = async () => {
  try {
    const result = await pool.query(getProductsQuery());
    const rows = result.rows.length > 0 ? result.rows[0].data || [] : [];
    const data = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        images: await listJpgFiles(row.img_directory),
      }))
    );
    return {
      statuscode: 200,
      successstatus: true,
      message: "Products fetched successfully",
      data,
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching query types. Error: ${err.message}`,
    };
  }
};

module.exports = getProducts;
