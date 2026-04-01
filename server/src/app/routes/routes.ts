import { Router } from "express";
import authRoutes       from "../modules/auth/auth.routes";
import attendanceRoutes from "../modules/attendance/attendance.routes";

const router = Router();

router.use("/auth",       authRoutes);
router.use("/attendance", attendanceRoutes);

export default router;