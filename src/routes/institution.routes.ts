import { Router } from "express";
import { Role } from "@prisma/client";
import {
  getInstitutionSummaryController,
  getInstitutions,
  getMyInstitutionTrainers,
} from "../controllers/institution.controller";
import { requireAuth, requireRole, requireUserProfile } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireUserProfile);

router.get("/", requireRole(Role.PROGRAMME_MANAGER), asyncHandler(getInstitutions));
router.get("/my/trainers", requireRole(Role.INSTITUTION), asyncHandler(getMyInstitutionTrainers));
router.get("/:id/summary", requireRole(Role.PROGRAMME_MANAGER), asyncHandler(getInstitutionSummaryController));

export default router;
