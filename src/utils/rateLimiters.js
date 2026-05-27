const rateLimit = require("express-rate-limit");

const buildResponse = (message) => ({
  statuscode: 429,
  powered_by: "ServerPe App Solutions",
  successstatus: false,
  message,
  data: null,
});

const makeLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json(buildResponse(message)),
  });

const globalLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message:
    "Too many requests from this IP. Please slow down and try again in a few minutes.",
});

const readLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message:
    "You are browsing too fast. Please wait a moment and try again.",
});

const writeLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message:
    "Too many submissions from this IP. Please wait a minute before trying again.",
});

const sensitiveLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message:
    "Too many attempts. Please wait 15 minutes before trying again.",
});

module.exports = {
  globalLimiter,
  readLimiter,
  writeLimiter,
  sensitiveLimiter,
};
