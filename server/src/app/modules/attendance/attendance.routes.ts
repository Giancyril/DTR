import { Router } from "express";
import * as controller from "./attendance.controller";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Employee clock in/out — AM & PM
router.post("/am-clock-in",  authenticate, controller.amClockIn);
router.post("/am-clock-out", authenticate, controller.amClockOut);
router.post("/pm-clock-in",  authenticate, controller.pmClockIn);
router.post("/pm-clock-out", authenticate, controller.pmClockOut);

// Shared
router.get("/",      authenticate, controller.getRecords);
router.get("/stats", authenticate, controller.getStats);
router.get("/dtr",   authenticate, controller.getDTRSummary);
router.put("/:id", authenticate, requireAdmin, controller.updateRecord);

// Admin only
router.post("/manual", authenticate, requireAdmin, controller.manualEntry);
router.delete("/:id",  authenticate, requireAdmin, controller.deleteRecord);

// DTR PDF export — POST so body params aren't exposed in the URL
router.post("/export-dtr", authenticate, controller.exportDTR);

export default router;