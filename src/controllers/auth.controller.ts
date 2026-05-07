import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { syncUserSchema } from "../validators/auth.validator";
import { HttpError } from "../utils/httpError";

export async function getMe(req: Request, res: Response) {
  if (!req.authUserId) {
    throw new HttpError(401, "Authentication required");
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId: req.authUserId },
    include: { institution: true },
  });

  return res.json({
    success: true,
    data: user,
  });
}

export async function syncUser(req: Request, res: Response) {
  if (!req.authUserId) {
    throw new HttpError(401, "Authentication required");
  }

  const body = syncUserSchema.parse(req.body);

  let institutionId: string | null = null;

  const needsInstitution =
    body.role === Role.TRAINER || body.role === Role.INSTITUTION || body.role === Role.STUDENT;

  if (needsInstitution && body.institutionName) {
    const institution = await prisma.institution.upsert({
      where: { name: body.institutionName.trim() },
      update: {},
      create: { name: body.institutionName.trim() },
    });
    institutionId = institution.id;
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: req.authUserId },
    update: {
      name: body.name,
      email: body.email,
      role: body.role,
      institutionId,
    },
    create: {
      clerkUserId: req.authUserId,
      name: body.name,
      email: body.email,
      role: body.role,
      institutionId,
    },
    include: { institution: true },
  });

  return res.status(200).json({
    success: true,
    data: user,
  });
}
