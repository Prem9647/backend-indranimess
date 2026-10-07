function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.originalUrl}` },
  });
}

module.exports = { notFoundMiddleware };
