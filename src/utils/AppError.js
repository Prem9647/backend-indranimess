class AppError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message, code = "BAD_REQUEST") {
    return new AppError(400, code, message);
  }

  static unauthorized(message = "Not authenticated", code = "UNAUTHORIZED") {
    return new AppError(401, code, message);
  }

  static forbidden(message = "Not authorized", code = "FORBIDDEN") {
    return new AppError(403, code, message);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND") {
    return new AppError(404, code, message);
  }

  static conflict(message, code = "CONFLICT") {
    return new AppError(409, code, message);
  }
}

module.exports = { AppError };
