const { AppError } = require("../utils/AppError");

function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || source}: ${issue.message}`)
        .join("; ");
      return next(AppError.badRequest(message, "VALIDATION_ERROR"));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
