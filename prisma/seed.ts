import { PrismaClient, Role, AttendanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const institution = await prisma.institution.upsert({
    where: { name: "SkillBridge Demo Institution" },
    update: {},
    create: { name: "SkillBridge Demo Institution" },
  });

  const trainer = await prisma.user.upsert({
    where: { email: "trainer@test.com" },
    update: {},
    create: {
      clerkUserId: "seed_trainer_clerk_id",
      name: "Demo Trainer",
      email: "trainer@test.com",
      role: Role.TRAINER,
      institutionId: institution.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      clerkUserId: "seed_student_clerk_id",
      name: "Demo Student",
      email: "student@test.com",
      role: Role.STUDENT,
      institutionId: institution.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "institution@test.com" },
    update: {},
    create: {
      clerkUserId: "seed_institution_clerk_id",
      name: "Demo Institution User",
      email: "institution@test.com",
      role: Role.INSTITUTION,
      institutionId: institution.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "pm@test.com" },
    update: {},
    create: {
      clerkUserId: "seed_pm_clerk_id",
      name: "Demo Programme Manager",
      email: "pm@test.com",
      role: Role.PROGRAMME_MANAGER,
    },
  });

  await prisma.user.upsert({
    where: { email: "monitor@test.com" },
    update: {},
    create: {
      clerkUserId: "seed_monitor_clerk_id",
      name: "Demo Monitoring Officer",
      email: "monitor@test.com",
      role: Role.MONITORING_OFFICER,
    },
  });

  const batch = await prisma.batch.create({
    data: {
      name: "Web Development Batch A",
      institutionId: institution.id,
      trainers: {
        create: { trainerId: trainer.id },
      },
      students: {
        create: { studentId: student.id },
      },
    },
  });

  const now = new Date();
  const start = new Date(now.getTime() - 30 * 60 * 1000);
  const end = new Date(now.getTime() + 90 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      title: "HTML and CSS Basics",
      date: now,
      startTime: start,
      endTime: end,
      batchId: batch.id,
      trainerId: trainer.id,
    },
  });

  await prisma.attendance.upsert({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      sessionId: session.id,
      studentId: student.id,
      status: AttendanceStatus.PRESENT,
    },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
