const { AppError } = require("../utils/AppError");
const { env } = require("../config/env");

// Single place that converts any thrown/rejected error into the
// { success: false, error: { code, message } } envelope. Never let a
// Mongoose/stack-trace error reach the client directly.
function errorMiddleware(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
  }

  if (env.nodeEnv !== "production") {
    console.error(err);
  }

  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
  });
}

module.exports = { errorMiddleware };
