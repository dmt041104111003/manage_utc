import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@utc.edu.vn";
const ADMIN_PASSWORD = "123";

async function main() {
  const passwordHash = await hash(ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      email: ADMIN_EMAIL,
      fullName: "Quản trị hệ thống",
      passwordHash,
      role: Role.admin,
      isLocked: false
    },
    update: {
      passwordHash,
      fullName: "Quản trị hệ thống",
      role: Role.admin,
      isLocked: false
    }
  });
  console.log(`Seeded admin: email ${ADMIN_EMAIL} (hoặc đăng nhập bằng "admin") / mật khẩu: ${ADMIN_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
