import { Request, Response } from "express";
import * as service from "./attendance.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const clockIn = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.clockIn(req.user.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const clockOut = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.clockOut(req.user.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const manualEntry = async (req: Request, res: Response) => {
  try {
    const data = await service.manualEntry(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getRecords = async (req: Request, res: Response) => {
  try {
    const data = await service.getRecords(req.query as any);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDTRSummary = async (req: Request, res: Response) => {
  try {
    const { userId, dateFrom, dateTo } = req.query as any;
    const data = await service.getDTRSummary({ userId, dateFrom, dateTo });
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    await service.deleteRecord(req.params.id);
    res.json({ success: true, message: "Record deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getStats = async (_req: Request, res: Response) => {
  try {
    const data = await service.getStats();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};