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

export const updateRecord = async (req: Request, res: Response) => {
  try {
    const data = await service.updateRecord(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /attendance/export-dtr
// Returns { base64: string } so Redux never handles a non-serializable Blob
export const exportDTR = async (req: Request, res: Response) => {
  try {
    const { userId, dateFrom, dateTo } = req.body as {
      userId:   string;
      dateFrom: string;
      dateTo:   string;
    };

    if (!userId || !dateFrom || !dateTo) {
      res.status(400).json({ success: false, message: "userId, dateFrom and dateTo are required" });
      return;
    }

    const pdfBuffer = await service.exportDTRPdf({ userId, dateFrom, dateTo });

    console.log("PDF buffer type:", typeof pdfBuffer, Buffer.isBuffer(pdfBuffer));
    console.log("PDF buffer first bytes:", pdfBuffer.slice(0, 4).toString("hex"));

    // Send as base64 JSON — the frontend converts it back to a Blob for download
    res.json({ success: true, base64: pdfBuffer.toString("base64") });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message ?? "Failed to generate PDF" });
  }
};