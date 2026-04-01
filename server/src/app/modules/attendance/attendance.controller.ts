import { Request, Response } from "express";
import * as service from "./attendance.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const amClockIn = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.amClockIn(req.user!.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const amClockOut = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.amClockOut(req.user!.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const pmClockIn = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.pmClockIn(req.user!.id);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const pmClockOut = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.pmClockOut(req.user!.id);
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
    const userId   = req.query.userId   as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo   = req.query.dateTo   as string;
    const data = await service.getDTRSummary({ userId, dateFrom, dateTo });
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await service.deleteRecord(id);
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