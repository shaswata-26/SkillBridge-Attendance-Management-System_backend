import express from "express";
import cors from "cors";
import type { CorsOptions } from "cors";
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

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/\/$/, "");
}

const allowedOrigins = env.FRONTEND_URL.split(",")
  .map(normalizeOrigin)
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes("*") || allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(helmet());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "SkillBridge Attendance API",
    health: "/health",
    docs: "/api/docs",
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "SkillBridge API is running" });
});

app.use("/api/docs", docsRoutes);
app.use("/api/auth", clerkMiddleware(), authRoutes);
app.use("/api/batches", clerkMiddleware(), batchRoutes);
app.use("/api/sessions", clerkMiddleware(), sessionRoutes);
app.use("/api/attendance", clerkMiddleware(), attendanceRoutes);
app.use("/api/institutions", clerkMiddleware(), institutionRoutes);
app.use("/api/programme", clerkMiddleware(), programmeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
