const { Router } = require("express");
const { validate } = require("../middleware/validate.middleware");
const { loginSchema } = require("../schemas/auth.schema");
const { login } = require("../controllers/auth.controller");

const router = Router();

router.post("/login", validate(loginSchema), login);

module.exports = router;
