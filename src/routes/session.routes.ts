import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createSession,
  getSessionAttendance,
  getStudentActiveSessions,
  getTrainerSessions,
} from "../controllers/session.controller";
import { requireAuth, requireRole, requireUserProfile } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireUserProfile);

router.post("/", requireRole(Role.TRAINER), asyncHandler(createSession));
router.get("/my", requireRole(Role.TRAINER), asyncHandler(getTrainerSessions));
router.get("/student-active", requireRole(Role.STUDENT), asyncHandler(getStudentActiveSessions));
router.get("/:id/attendance", requireRole(Role.TRAINER), asyncHandler(getSessionAttendance));

export default router;
