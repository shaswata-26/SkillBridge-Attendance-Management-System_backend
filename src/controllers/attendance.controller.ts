import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { markAttendanceSchema } from "../validators/attendance.validator";
import { HttpError } from "../utils/httpError";

export async function markAttendance(req: Request, res: Response) {
  const user = req.appUser!;
  const body = markAttendanceSchema.parse(req.body);

  const session = await prisma.session.findUnique({
    where: { id: body.sessionId },
    include: { batch: { include: { students: true } } },
  });

  if (!session) {
    throw new HttpError(404, "Session not found");
  }

  const isEnrolled = session.batch.students.some((student) => student.studentId === user.id);

  if (!isEnrolled) {
    throw new HttpError(403, "You are not enrolled in this session's batch");
  }

  const now = new Date();
  if (now > session.endTime) {
    throw new HttpError(400, "Attendance window has closed for this session");
  }

  const attendance = await prisma.attendance.create({
    data: {
      sessionId: body.sessionId,
      studentId: user.id,
      status: body.status,
    },
  }).catch(() => {
    throw new HttpError(409, "Attendance already marked for this session");
  });

  return res.status(201).json({ success: true, data: attendance });
}
