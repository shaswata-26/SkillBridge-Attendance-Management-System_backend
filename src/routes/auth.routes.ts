import { Router } from "express";
import { getMe, syncUser } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMe));
router.post("/sync", requireAuth, asyncHandler(syncUser));

export default router;
