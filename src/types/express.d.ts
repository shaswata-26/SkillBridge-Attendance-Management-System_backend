import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      appUser?: User;
      authUserId?: string;
    }
  }
}
