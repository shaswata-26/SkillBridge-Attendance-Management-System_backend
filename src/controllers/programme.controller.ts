import type { Request, Response } from "express";
import { getProgrammeSummary } from "../services/summary.service";

export async function getProgrammeSummaryController(_req: Request, res: Response) {
  const summary = await getProgrammeSummary();
  return res.json({ success: true, data: summary });
}
