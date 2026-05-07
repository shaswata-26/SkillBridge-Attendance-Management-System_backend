import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { createSessionSchema } from "../validators/session.validator";
import { HttpError } from "../utils/httpError";

export async function createSession(req: Request, res: Response) {
  const user = req.appUser!;
  const body = createSessionSchema.parse(req.body);

  if (new Date(body.endTime) <= new Date(body.startTime)) {
    throw new HttpError(400, "End time must be after start time");
  }

  const trainerBatch = await prisma.batchTrainer.findUnique({
    where: {
      batchId_trainerId: {
        batchId: body.batchId,
        trainerId: user.id,
      },
    },
  });

  if (!trainerBatch) {
    throw new HttpError(403, "You can only create sessions for your assigned batches");
  }

  const session = await prisma.session.create({
    data: {
      batchId: body.batchId,
      trainerId: user.id,
      title: body.title,
      date: new Date(body.date),
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
    },
    include: { batch: true },
  });

  return res.status(201).json({ success: true, data: session });
}

export async function getTrainerSessions(req: Request, res: Response) {
  const user = req.appUser!;
  const sessions = await prisma.session.findMany({
    where: { trainerId: user.id },
    include: {
      batch: true,
      attendance: { include: { student: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return res.json({ success: true, data: sessions });
}

export async function getStudentActiveSessions(req: Request, res: Response) {
  const user = req.appUser!;
  const now = new Date();

  const sessions = await prisma.session.findMany({
    where: {
      batch: {
        students: { some: { studentId: user.id } },
      },
      endTime: { gte: now },
    },
    include: {
      batch: true,
      trainer: { select: { id: true, name: true, email: true } },
      attendance: { where: { studentId: user.id } },
    },
    orderBy: { startTime: "asc" },
  });

  return res.json({ success: true, data: sessions });
}

export async function getSessionAttendance(req: Request, res: Response) {
  const user = req.appUser!;
  const { id } = req.params;

  const session = await prisma.session.findFirst({
    where: { id, trainerId: user.id },
    include: {
      batch: {
        include: {
          students: { include: { student: true } },
        },
      },
      attendance: { include: { student: true } },
    },
  });

  if (!session) {
    throw new HttpError(404, "Session not found or not owned by you");
  }

  return res.json({ success: true, data: session });
}
