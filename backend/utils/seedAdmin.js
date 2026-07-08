// Run with: npm run seed:admin
// Creates (or promotes) an admin account using ADMIN_* values from .env
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  let user = await User.findOne({ email });

  if (user) {
    user.role = "admin";
    await user.save();
    console.log(`Existing user ${email} promoted to admin.`);
  } else {
    user = await User.create({
      name: process.env.ADMIN_NAME || "Platform Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
      role: "admin",
    });
    console.log(`Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
