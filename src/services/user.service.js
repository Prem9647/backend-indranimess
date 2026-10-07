const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const { AppError } = require("../utils/AppError");

const SALT_ROUNDS = 10;

async function createUser(input) {
  const existing = await User.findOne({ $or: [{ email: input.email }, { phone: input.phone }] });
  if (existing) {
    throw AppError.conflict("A user with this email or phone already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({ ...input, password: passwordHash });
  return sanitize(user);
}

async function listUsers(role) {
  const filter = role ? { role } : {};
  const users = await User.find(filter).sort({ createdAt: -1 });
  return users.map(sanitize);
}

async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound("User not found");
  return sanitize(user);
}

async function updateUser(userId, input) {
  const user = await User.findByIdAndUpdate(userId, input, { new: true });
  if (!user) throw AppError.notFound("User not found");
  return sanitize(user);
}

async function resetPassword(userId, newPassword) {
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const user = await User.findByIdAndUpdate(userId, { password: passwordHash }, { new: true });
  if (!user) throw AppError.notFound("User not found");
  return sanitize(user);
}

function sanitize(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

module.exports = { createUser, listUsers, getUserById, updateUser, resetPassword };
