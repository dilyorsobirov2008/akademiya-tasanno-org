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

  const targetAdmins = [
    { phone: "999120701", pass: "Feruza0701", name: "Feruza Admin" },
    { phone: "+998999120701", pass: "Feruza0701", name: "Feruza Admin" },
    { phone: "+998900000000", pass: "Admin123!", name: "Bosh Administrator" },
  ];

  for (const admin of targetAdmins) {
    const existingAdmin = await prisma.user.findUnique({ where: { phone: admin.phone } });
    const passwordHash = await bcrypt.hash(admin.pass, 10);
    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          fullName: admin.name,
          phone: admin.phone,
          passwordHash,
          role: "admin",
          status: "approved",
        },
      });
      console.log(`Admin yaratildi -> telefon: ${admin.phone}`);
    } else {
      await prisma.user.update({
        where: { phone: admin.phone },
        data: {
          passwordHash,
          role: "admin",
          status: "approved",
        },
      });
      console.log(`Admin yangilandi -> telefon: ${admin.phone}`);
    }
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
