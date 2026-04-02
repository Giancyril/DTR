import { Router } from "express";
import * as controller from "./auth.controller";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/register", authenticate, requireAdmin, controller.register);
router.post("/login",    controller.login);
router.get("/users",     authenticate, requireAdmin, controller.getUsers);
router.put("/users/:id", authenticate, requireAdmin, controller.updateUser);
router.delete("/users/:id", authenticate, requireAdmin, controller.deleteUser);
router.put("/change-password", authenticate, controller.changePassword);
router.put("/profile",          authenticate, controller.updateProfile);

export default router;