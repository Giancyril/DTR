import { Router } from "express";
import * as controller from "./attendance.controller";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Employee routes
router.post("/clock-in",  authenticate, controller.clockIn);
router.post("/clock-out", authenticate, controller.clockOut);

// Shared
router.get("/",       authenticate, controller.getRecords);
router.get("/stats",  authenticate, controller.getStats);
router.get("/dtr",    authenticate, controller.getDTRSummary);

// Admin only
router.post("/manual",   authenticate, requireAdmin, controller.manualEntry);
router.delete("/:id",    authenticate, requireAdmin, controller.deleteRecord);

export default router;