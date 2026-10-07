const { Customer } = require("../models/Customer");
const { Order } = require("../models/Order");
const { AppError } = require("../utils/AppError");

// Mobile number is the identity key — see .claude/skills/restaurant-workflow.
// Found -> load existing (gives order history); not found -> create inline.
async function findOrCreateByMobile(name, mobileNumber) {
  const existing = await Customer.findOne({ mobileNumber });
  if (existing) {
    return existing;
  }
  return Customer.create({ name, mobileNumber });
}

// Joins each customer's lifetime order stats (count, spend on closed orders,
// most recent order date) for the Customer Management page — one aggregate
// rather than a per-row round trip.
async function listCustomers() {
  const [customers, stats] = await Promise.all([
    Customer.find().sort({ createdAt: -1 }),
    Order.aggregate([
      {
        $group: {
          _id: "$customerId",
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: { $cond: [{ $eq: ["$status", "closed"] }, "$finalAmount", 0] } },
          lastVisit: { $max: "$orderedAt" },
        },
      },
    ]),
  ]);
  const statsByCustomer = new Map(stats.map((s) => [s._id.toString(), s]));

  return customers.map((customer) => {
    const s = statsByCustomer.get(customer._id.toString());
    return {
      ...customer.toObject(),
      totalOrders: s?.totalOrders ?? 0,
      totalSpent: s?.totalSpent ?? 0,
      lastVisit: s?.lastVisit ?? null,
    };
  });
}

async function createCustomer(input) {
  const existing = await Customer.findOne({ mobileNumber: input.mobileNumber });
  if (existing) {
    throw AppError.conflict("A customer with this mobile number already exists");
  }
  return Customer.create(input);
}

async function updateCustomer(customerId, input) {
  if (input.mobileNumber) {
    const existing = await Customer.findOne({ mobileNumber: input.mobileNumber, _id: { $ne: customerId } });
    if (existing) {
      throw AppError.conflict("A customer with this mobile number already exists");
    }
  }
  const customer = await Customer.findByIdAndUpdate(customerId, input, { new: true });
  if (!customer) throw AppError.notFound("Customer not found");
  return customer;
}

async function searchCustomers(query) {
  if (!query) return [];
  return Customer.find({
    $or: [
      { mobileNumber: { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
    ],
  })
    .limit(20)
    .sort({ createdAt: -1 });
}

async function getCustomerById(customerId) {
  return Customer.findById(customerId);
}

module.exports = {
  findOrCreateByMobile,
  searchCustomers,
  getCustomerById,
  listCustomers,
  createCustomer,
  updateCustomer,
};
