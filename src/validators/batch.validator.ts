import { z } from "zod";

export const createBatchSchema = z.object({
  name: z.string().min(2, "Batch name is required"),
  institutionId: z.string().optional(),
});

export const createInviteSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});

export const joinBatchSchema = z.object({
  token: z.string().min(8, "Invite token is required"),
});
