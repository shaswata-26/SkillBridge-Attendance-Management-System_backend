import { Router } from "express";
import { Role } from "@prisma/client";
import { markAttendance } from "../controllers/attendance.controller";
import { requireAuth, requireRole, requireUserProfile } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireUserProfile);

router.post("/mark", requireRole(Role.STUDENT), asyncHandler(markAttendance));

export default router;
