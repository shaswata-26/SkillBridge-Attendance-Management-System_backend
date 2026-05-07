import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { nanoid } from "nanoid";
import { prisma } from "../config/prisma";
import { createBatchSchema, createInviteSchema, joinBatchSchema } from "../validators/batch.validator";
import { HttpError } from "../utils/httpError";
import { getBatchSummary } from "../services/summary.service";

export async function createBatch(req: Request, res: Response) {
  const user = req.appUser!;
  const body = createBatchSchema.parse(req.body);

  let institutionId = user.institutionId;

  if (user.role === Role.INSTITUTION) {
    institutionId = user.institutionId;
  }

  if (user.role === Role.TRAINER && body.institutionId) {
    institutionId = body.institutionId;
  }

  if (!institutionId) {
    throw new HttpError(400, "Institution is required to create a batch");
  }

  const batch = await prisma.batch.create({
    data: {
      name: body.name,
      institutionId,
      trainers: user.role === Role.TRAINER ? { create: { trainerId: user.id } } : undefined,
    },
    include: {
      institution: true,
      trainers: { include: { trainer: true } },
      students: { include: { student: true } },
    },
  });

  return res.status(201).json({ success: true, data: batch });
}

export async function getMyBatches(req: Request, res: Response) {
  const user = req.appUser!;

  if (user.role === Role.TRAINER) {
    const batches = await prisma.batch.findMany({
      where: { trainers: { some: { trainerId: user.id } } },
      include: { institution: true, students: true, sessions: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: batches });
  }

  if (user.role === Role.INSTITUTION) {
    const batches = await prisma.batch.findMany({
      where: { institutionId: user.institutionId ?? "" },
      include: {
        institution: true,
        trainers: { include: { trainer: true } },
        students: { include: { student: true } },
        sessions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: batches });
  }

  throw new HttpError(403, "Role not allowed");
}

export async function getStudentBatches(req: Request, res: Response) {
  const user = req.appUser!;
  const memberships = await prisma.batchStudent.findMany({
    where: { studentId: user.id },
    include: { batch: { include: { institution: true, sessions: true } } },
  });

  return res.json({ success: true, data: memberships.map((membership) => membership.batch) });
}

export async function createInvite(req: Request, res: Response) {
  const user = req.appUser!;
  const body = createInviteSchema.parse(req.body);
  const { id } = req.params;

  const batch = await prisma.batch.findFirst({
    where: {
      id,
      trainers: { some: { trainerId: user.id } },
    },
  });

  if (!batch) {
    throw new HttpError(404, "Batch not found or you are not assigned to it");
  }

  const invite = await prisma.batchInvite.create({
    data: {
      batchId: batch.id,
      token: nanoid(24),
      createdBy: user.id,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      ...invite,
      invitePath: `/join-batch?token=${invite.token}&batchId=${batch.id}`,
    },
  });
}

export async function joinBatch(req: Request, res: Response) {
  const user = req.appUser!;
  const { id } = req.params;
  const body = joinBatchSchema.parse(req.body);

  const invite = await prisma.batchInvite.findFirst({
    where: {
      batchId: id,
      token: body.token,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    include: { batch: true },
  });

  if (!invite) {
    throw new HttpError(400, "Invalid or expired invite token");
  }

  const membership = await prisma.batchStudent.upsert({
    where: {
      batchId_studentId: {
        batchId: id,
        studentId: user.id,
      },
    },
    update: {},
    create: {
      batchId: id,
      studentId: user.id,
    },
    include: { batch: true },
  });

  return res.status(200).json({ success: true, data: membership });
}

export async function getBatchSummaryController(req: Request, res: Response) {
  const user = req.appUser!;
  const { id } = req.params;

  const batch = await prisma.batch.findUnique({ where: { id } });

  if (!batch) {
    throw new HttpError(404, "Batch not found");
  }

  if (batch.institutionId !== user.institutionId) {
    throw new HttpError(403, "You can only view summaries for your institution");
  }

  const summary = await getBatchSummary(id);
  return res.json({ success: true, data: summary });
}
