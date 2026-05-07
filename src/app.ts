import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import batchRoutes from "./routes/batch.routes";
import sessionRoutes from "./routes/session.routes";
import attendanceRoutes from "./routes/attendance.routes";
import institutionRoutes from "./routes/institution.routes";
import programmeRoutes from "./routes/programme.routes";
import docsRoutes from "./routes/docs.routes";
import { errorHandler, notFoundHandler } from "./middlewares/error";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SkillBridge API is running" });
});

app.use("/api/docs", docsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/programme", programmeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
