import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL lama helin.");
  process.exit(1);
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const name = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

if (!name || !email || !password) {
  console.log(
    'Isticmaal: node scripts/create-admin.mjs "Magaca" "email" "password"'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.log("Password-ku waa inuu ugu yaraan 8 xaraf yahay.");
  process.exit(1);
}

try {
  const normalizedEmail = email.toLowerCase().trim();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: {
      email: normalizedEmail,
    },

    update: {
      name: name.trim(),
      password: hashedPassword,
      role: "ADMIN",
    },

    create: {
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin-ka waa diyaar, password-kana waa la cusboonaysiiyay.");
  console.log("Magaca:", user.name);
  console.log("Email:", user.email);
} catch (error) {
  console.error("❌ Admin-ka lama cusboonaysiin.");
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}