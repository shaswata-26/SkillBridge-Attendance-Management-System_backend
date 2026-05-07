import { Role } from "@prisma/client";
import { z } from "zod";

export const syncUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.nativeEnum(Role),
  institutionName: z.string().optional(),
});
