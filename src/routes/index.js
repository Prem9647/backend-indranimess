const { Router } = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const customerRoutes = require("./customer.routes");
const tableRoutes = require("./table.routes");
const categoryRoutes = require("./category.routes");
const menuItemRoutes = require("./menuItem.routes");
const orderRoutes = require("./order.routes");
const kitchenRoutes = require("./kitchen.routes");
const reportRoutes = require("./report.routes");
const settingsRoutes = require("./settings.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/customers", customerRoutes);
router.use("/tables", tableRoutes);
router.use("/categories", categoryRoutes);
router.use("/menu-items", menuItemRoutes);
router.use("/orders", orderRoutes);
router.use("/kitchen", kitchenRoutes);
router.use("/reports", reportRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
