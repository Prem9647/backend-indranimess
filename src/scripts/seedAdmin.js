require("dotenv/config");
const bcrypt = require("bcrypt");
const { connectDB, disconnectDB } = require("../config/db");
const { User } = require("../models/User");

// One-time bootstrap: the create-user endpoint deliberately excludes the
// "admin" role (see schemas/user.schema.js), so the first admin has to be
// created out-of-band. Run with: npm run seed:admin
async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL;
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !phone || !password) {
    throw new Error("ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD must be set");
  }

  await connectDB();

  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    console.log(`[seed:admin] an admin already exists (${existing.email}) — nothing to do`);
    await disconnectDB();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, phone, password: passwordHash, role: "admin" });
  console.log(`[seed:admin] created admin account: ${admin.email}`);

  await disconnectDB();
}

main().catch((err) => {
  console.error("[seed:admin] failed", err);
  process.exit(1);
});
