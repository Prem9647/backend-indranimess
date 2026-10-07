const { Router } = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const reportController = require("../controllers/report.controller");

const router = Router();

router.use(authenticate, authorize("manager", "admin"));

router.get("/sales/daily", reportController.dailySales);
router.get("/sales/weekly", reportController.weeklySales);
router.get("/sales/monthly", reportController.monthlySales);
router.get("/popular-items", reportController.popularItems);
router.get("/least-ordered-items", reportController.leastOrderedItems);
router.get("/table-usage", reportController.tableUsage);
router.get("/overview", reportController.overview);
router.get("/customers/:customerId/orders", reportController.customerOrderHistory);
router.get("/item-sales/:menuItemId", reportController.itemSales);

module.exports = router;
