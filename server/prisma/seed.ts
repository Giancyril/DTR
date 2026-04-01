import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dtr.com" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@dtr.com",
      password: hashedPassword,
      role: Role.ADMIN,
      department: "Management",
      position: "System Administrator",
    },
  });

  console.log("✅ Admin user created:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });