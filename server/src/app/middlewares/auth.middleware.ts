import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id:    string;
    name:  string;
    email: string;
    role:  string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!token) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string; name: string; email: string; role: string;
    };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ success: false, message: "Admin access required" });
    return;
  }
  next();
};