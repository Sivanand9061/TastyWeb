const rateLimit = require('express-rate-limit');

// General rate limiter for all API requests
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});

// Stricter rate limiter specifically for creating orders
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 order creations per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many orders placed. Please wait a few minutes before trying again.' }
});

module.exports = {
  globalLimiter,
  orderLimiter
};
