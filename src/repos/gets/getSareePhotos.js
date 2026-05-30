const fs = require("fs");
const path = require("path");

const SAREES_DIR = path.join(__dirname, "..", "..", "uploads", "sarees");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"]);
const VIDEO_EXT = new Set([".mp4", ".mov", ".webm", ".mkv", ".avi"]);

const listFiles = async (dir, allowedExt, urlPrefix) => {
  try {
    const files = await fs.promises.readdir(dir);
    return files
      .filter((f) => allowedExt.has(path.extname(f).toLowerCase()))
      .map((f) => ({ name: f, url: `${urlPrefix}/${f}` }));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
};

const PART_KEYS = ["blouse", "border", "pallu"];
const VIEW_MAP = { c: "close", f: "far" };

const categorizeImages = (images) => {
  const result = {
    blouse: { close: null, far: null },
    border: { close: null, far: null },
    pallu: { close: null, far: null },
    other: [],
  };

  for (const img of images) {
    const base = path.parse(img.name).name.toLowerCase();
    const tokens = base.split("_");
    const viewToken = tokens[tokens.length - 1];
    const partToken = tokens[tokens.length - 2];

    if (
      PART_KEYS.includes(partToken) &&
      Object.prototype.hasOwnProperty.call(VIEW_MAP, viewToken)
    ) {
      result[partToken][VIEW_MAP[viewToken]] = img;
    } else {
      result.other.push(img);
    }
  }

  return result;
};

const getSareePhotos = async (req, sareeId, colorCode) => {
  try {
    const baseDir = path.join(SAREES_DIR, String(sareeId), colorCode);
    if (!fs.existsSync(baseDir)) {
      return {
        statuscode: 404,
        successstatus: false,
        message: `No media found for saree '${sareeId}' color '${colorCode}'`,
      };
    }

    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/sarees/${sareeId}/${colorCode}`;
    const [images, videos] = await Promise.all([
      listFiles(path.join(baseDir, "IMAGES"), IMAGE_EXT, `${baseUrl}/IMAGES`),
      listFiles(path.join(baseDir, "VIDEOS"), VIDEO_EXT, `${baseUrl}/VIDEOS`),
    ]);

    return {
      statuscode: 200,
      successstatus: true,
      message: "Saree media fetched successfully",
      data: { images: categorizeImages(images), videos },
    };
  } catch (err) {
    return {
      statuscode: 500,
      successstatus: false,
      message: `Error fetching saree media. Error: ${err.message}`,
    };
  }
};

module.exports = getSareePhotos;
