import { Router } from "express";
import { Role } from "@prisma/client";
import { getProgrammeSummaryController } from "../controllers/programme.controller";
import { requireAuth, requireRole, requireUserProfile } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireUserProfile);

router.get("/summary", requireRole(Role.PROGRAMME_MANAGER, Role.MONITORING_OFFICER), asyncHandler(getProgrammeSummaryController));

export default router;
