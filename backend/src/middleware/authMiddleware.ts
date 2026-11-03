import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: "guest" | "staff";
    };
}

export function authMiddleware(
   req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            message: "Access denied. Token missing."
        });
        return;
    }
    const token = authHeader.split(" ")[1];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({
            message: "Server authentication configuration error"
        });
        return;
    }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (
        typeof decoded === "string" ||
        typeof decoded.userId !== "string" ||
        (decoded.role !== "guest" && decoded.role !== "staff")
    ) {
        res.status(401).json({
            message: "Invalid token payload"
        });
        return;
    }
    req.user = {
        userId: decoded.userId,
        role: decoded.role
    };
    next();
} catch (error) {
    res.status(401).json({
        message: "Invalid or expired token"
    });
    return;
}
}

export async function staffOnly(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            res.status(401).json({
                message: "Authentication required"
            });
            return;
        }

        const user = await User.findById(req.user.userId);

        if (!user || user.role !== "staff") {
            res.status(403).json({
                message: "Staff access required"
            });
            return;
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Authorization failed"
        });
    }
}
