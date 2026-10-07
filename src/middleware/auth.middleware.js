const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { AppError } = require("../utils/AppError");

function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(AppError.unauthorized());
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}

// Authorization is enforced here, server-side — hiding a button client-side
// is UX, not security. See .claude/skills/authentication/skill.md
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden());
    }
    next();
  };
}

module.exports = { authenticate, authorize };
