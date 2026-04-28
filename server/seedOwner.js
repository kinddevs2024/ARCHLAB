import bcrypt from "bcryptjs";
import { connectDb } from "./db.js";
import { User } from "./models/User.js";

const run = async () => {
  await connectDb();
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;

  if (!email || !password) {
    throw new Error("Set OWNER_EMAIL and OWNER_PASSWORD before running seed:owner");
  }

  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      status: "Owner",
      name: process.env.OWNER_NAME || "ARCH",
      surname: process.env.OWNER_SURNAME || "Owner",
      phone: process.env.OWNER_PHONE || "-",
      address: process.env.OWNER_ADDRESS || "-",
      username: process.env.OWNER_USERNAME || "owner",
      active: true,
      password: await bcrypt.hash(password, 10),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Owner ready: ${user.email}`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
