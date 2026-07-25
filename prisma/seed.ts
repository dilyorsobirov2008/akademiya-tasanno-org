import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const branchNames = [
    "Bozorcha",
    "Tasanno (Asaka)",
    "Tasanno (Marhamat)",
    "Tasanno (Shahrixon)",
  ];

  const positionNames = [
    "Sifat nazorati xodimi",
    "SMM xodimi",
    "Sotuvchi-konsultant",
    "Ta'minot bo'limi rahbari",
    "Kassir",
    "Prixod qiluvchi / Tovar qabul qiluvchi",
    "Savdo zali menejeri",
    "Kuryer",
    "Kassir yordamchisi",
  ];

  for (const name of branchNames) {
    await prisma.branch.upsert({ where: { name }, update: {}, create: { name } });
  }

  for (const name of positionNames) {
    await prisma.position.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminPhone = "+998900000000";
  const existingAdmin = await prisma.user.findUnique({ where: { phone: adminPhone } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin123!", 10);
    await prisma.user.create({
      data: {
        fullName: "Bosh Administrator",
        phone: adminPhone,
        passwordHash,
        role: "admin",
        status: "approved",
      },
    });
    console.log(`Admin yaratildi -> telefon: ${adminPhone}, parol: Admin123!`);
  }

  console.log("Seed muvaffaqiyatli yakunlandi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
