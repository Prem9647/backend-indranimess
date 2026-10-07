// Wraps async controllers so rejected promises reach errorMiddleware
// instead of needing a try/catch in every controller.
function asyncHandler(handler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

module.exports = { asyncHandler };
