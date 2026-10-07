const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/apiResponse");
const userService = require("../services/user.service");

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  created(res, user);
});

const listUsers = asyncHandler(async (req, res) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const users = await userService.listUsers(role);
  ok(res, users);
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ok(res, user);
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  ok(res, user);
});

const resetPassword = asyncHandler(async (req, res) => {
  const user = await userService.resetPassword(req.params.id, req.body.password);
  ok(res, user);
});

module.exports = { createUser, listUsers, getUser, updateUser, resetPassword };
