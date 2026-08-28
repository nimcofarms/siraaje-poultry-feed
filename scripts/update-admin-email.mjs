import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL lama helin.");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

try {
  const user = await prisma.user.update({
    where: {
      email: "admin@siraajepoultryfeed.com",
    },
    data: {
      email: "keyse.siraaje@gmail.com",
      name: "Keyse",
    },
  });

  console.log("Admin-ka waa la cusboonaysiiyay.");
  console.log("Magaca:", user.name);
  console.log("Email:", user.email);
} catch (error) {
  console.error("Admin-ka lama cusboonaysiin.");
  console.error(error);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
