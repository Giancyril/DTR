import { Request, Response } from "express";
import * as service from "./auth.service";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const register = async (req: Request, res: Response) => {
  try {
    const data = await service.register(req.body);
    res.status(201).json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data = await service.login(req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(401).json({ success: false, message: err.message });
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const data = await service.getUsers();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await service.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const data = await service.updateUser(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const data = await service.changePassword(req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};