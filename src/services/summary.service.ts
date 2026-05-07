import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

type AttendanceCount = {
  status: AttendanceStatus;
  _count: { status: number };
};

function toRate(count: number, total: number) {
  if (total === 0) return 0;
  return Math.round((count / total) * 10000) / 100;
}

function statusCount(rows: AttendanceCount[], status: AttendanceStatus) {
  return rows.find((row) => row.status === status)?._count.status ?? 0;
}

export async function getBatchSummary(batchId: string) {
  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    include: {
      institution: true,
      students: true,
      sessions: true,
    },
  });

  if (!batch) return null;

  const grouped = await prisma.attendance.groupBy({
    by: ["status"],
    where: { session: { batchId } },
    _count: { status: true },
  });

  const totalMarks = grouped.reduce((sum, row) => sum + row._count.status, 0);
  const present = statusCount(grouped, "PRESENT");
  const late = statusCount(grouped, "LATE");
  const absent = statusCount(grouped, "ABSENT");

  return {
    batchId: batch.id,
    batchName: batch.name,
    institutionName: batch.institution.name,
    totalStudents: batch.students.length,
    totalSessions: batch.sessions.length,
    totalMarks,
    present,
    late,
    absent,
    attendanceRate: toRate(present + late, totalMarks),
  };
}

export async function getInstitutionSummary(institutionId: string) {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    include: { batches: true },
  });

  if (!institution) return null;

  const batchSummaries = await Promise.all(institution.batches.map((batch) => getBatchSummary(batch.id)));
  const cleanSummaries = batchSummaries.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getBatchSummary>>>[];

  const totals = cleanSummaries.reduce(
    (acc, batch) => {
      acc.students += batch.totalStudents;
      acc.sessions += batch.totalSessions;
      acc.marks += batch.totalMarks;
      acc.present += batch.present;
      acc.late += batch.late;
      acc.absent += batch.absent;
      return acc;
    },
    { students: 0, sessions: 0, marks: 0, present: 0, late: 0, absent: 0 },
  );

  return {
    institutionId: institution.id,
    institutionName: institution.name,
    totalBatches: institution.batches.length,
    ...totals,
    attendanceRate: toRate(totals.present + totals.late, totals.marks),
    batches: cleanSummaries,
  };
}

export async function getProgrammeSummary() {
  const institutions = await prisma.institution.findMany({ orderBy: { createdAt: "desc" } });
  const institutionSummaries = await Promise.all(institutions.map((institution) => getInstitutionSummary(institution.id)));
  const cleanSummaries = institutionSummaries.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getInstitutionSummary>>>[];

  const totals = cleanSummaries.reduce(
    (acc, institution) => {
      acc.batches += institution.totalBatches;
      acc.students += institution.students;
      acc.sessions += institution.sessions;
      acc.marks += institution.marks;
      acc.present += institution.present;
      acc.late += institution.late;
      acc.absent += institution.absent;
      return acc;
    },
    { batches: 0, students: 0, sessions: 0, marks: 0, present: 0, late: 0, absent: 0 },
  );

  return {
    totalInstitutions: institutions.length,
    ...totals,
    attendanceRate: toRate(totals.present + totals.late, totals.marks),
    institutions: cleanSummaries,
  };
}
