import type { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { getInstitutionSummary } from "../services/summary.service";
import { HttpError } from "../utils/httpError";

export async function getInstitutions(req: Request, res: Response) {
  const institutions = await prisma.institution.findMany({
    include: {
      _count: { select: { batches: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, data: institutions });
}

export async function getInstitutionSummaryController(req: Request, res: Response) {
  const { id } = req.params;
  const summary = await getInstitutionSummary(id);

  if (!summary) {
    throw new HttpError(404, "Institution not found");
  }

  return res.json({ success: true, data: summary });
}

export async function getMyInstitutionTrainers(req: Request, res: Response) {
  const user = req.appUser!;
  if (!user.institutionId) {
    throw new HttpError(400, "Institution user is not linked to an institution");
  }

  const trainers = await prisma.user.findMany({
    where: {
      institutionId: user.institutionId,
      role: "TRAINER",
    },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ success: true, data: trainers });
}
