import { z } from "zod";

export const createSessionSchema = z.object({
  batchId: z.string().min(1),
  title: z.string().min(2),
  date: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
});
