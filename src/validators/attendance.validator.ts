import { AttendanceStatus } from "@prisma/client";
import { z } from "zod";

export const markAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  status: z.nativeEnum(AttendanceStatus),
});
