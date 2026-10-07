const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/User");
const { AppError } = require("../utils/AppError");
const { env } = require("../config/env");

async function login(input) {
  const user = await User.findOne({ email: input.email }).select("+password");
  if (!user) {
    throw AppError.unauthorized("Invalid email or password");
  }
  if (!user.isActive) {
    throw AppError.forbidden("This account has been deactivated");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
}

module.exports = { login };
