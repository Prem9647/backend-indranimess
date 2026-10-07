const { asyncHandler } = require("../utils/asyncHandler");
const { ok, created } = require("../utils/apiResponse");
const { AppError } = require("../utils/AppError");
const customerService = require("../services/customer.service");

const searchCustomers = asyncHandler(async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  const customers = await customerService.searchCustomers(query);
  ok(res, customers);
});

const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  if (!customer) throw AppError.notFound("Customer not found");
  ok(res, customer);
});

const listCustomers = asyncHandler(async (_req, res) => {
  const customers = await customerService.listCustomers();
  ok(res, customers);
});

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.body);
  created(res, customer);
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  ok(res, customer);
});

module.exports = { searchCustomers, getCustomer, listCustomers, createCustomer, updateCustomer };
