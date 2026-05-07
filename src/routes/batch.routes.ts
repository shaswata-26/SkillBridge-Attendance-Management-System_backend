import { Router } from "express";
import { Role } from "@prisma/client";
import {
  createBatch,
  createInvite,
  getBatchSummaryController,
  getMyBatches,
  getStudentBatches,
  joinBatch,
} from "../controllers/batch.controller";
import { requireAuth, requireRole, requireUserProfile } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireUserProfile);

router.post("/", requireRole(Role.TRAINER, Role.INSTITUTION), asyncHandler(createBatch));
router.get("/my", requireRole(Role.TRAINER, Role.INSTITUTION), asyncHandler(getMyBatches));
router.get("/student", requireRole(Role.STUDENT), asyncHandler(getStudentBatches));
router.post("/:id/invite", requireRole(Role.TRAINER), asyncHandler(createInvite));
router.post("/:id/join", requireRole(Role.STUDENT), asyncHandler(joinBatch));
router.get("/:id/summary", requireRole(Role.INSTITUTION), asyncHandler(getBatchSummaryController));

export default router;
