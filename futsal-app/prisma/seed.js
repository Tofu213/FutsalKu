const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const passwordOwner = await bcrypt.hash("owner123", 10);
  const passwordKasir = await bcrypt.hash("kasir123", 10);

  await prisma.user.upsert({
    where: { noHp: "081200000001" },
    update: {},
    create: {
      nama: "Budi (Owner)",
      noHp: "081200000001",
      email: "owner@futsalku.test",
      password: passwordOwner,
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { noHp: "081200000002" },
    update: {},
    create: {
      nama: "Sari (Kasir)",
      noHp: "081200000002",
      email: "kasir@futsalku.test",
      password: passwordKasir,
      role: "KASIR",
    },
  });

  const lapanganData = [
    { nama: "Lapangan A - Indoor Vinyl", jenis: "Indoor", hargaPerJam: 150000 },
    { nama: "Lapangan B - Synthetic Grass", jenis: "Synthetic Grass", hargaPerJam: 180000 },
    { nama: "Lapangan C - Outdoor", jenis: "Outdoor", hargaPerJam: 120000 },
  ];

  for (const l of lapanganData) {
    const ada = await prisma.lapangan.findFirst({ where: { nama: l.nama } });
    if (!ada) {
      await prisma.lapangan.create({ data: l });
    }
  }

  // Aturan default Owner: DP 50%, DP hangus jika dibatalkan
  await prisma.pengaturan.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, dpPersen: 50, perlakuanDpBatal: "HANGUS" },
  });

  console.log("Seed selesai. Akun demo:");
  console.log("  Owner  -> 081200000001 / owner123");
  console.log("  Kasir  -> 081200000002 / kasir123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
