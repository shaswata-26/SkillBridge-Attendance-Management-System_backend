import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { Role } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../utils/httpError";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      throw new HttpError(401, "Authentication required");
    }

    req.authUserId = auth.userId;
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireUserProfile(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.authUserId) {
      throw new HttpError(401, "Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: req.authUserId },
    });

    if (!user) {
      throw new HttpError(404, "User profile not found. Complete onboarding first.");
    }

    req.appUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.appUser) {
        throw new HttpError(401, "User profile required");
      }

      if (!allowedRoles.includes(req.appUser.role)) {
        throw new HttpError(403, "You are not allowed to perform this action");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
