import { Request, Response, NextFunction } from "express";
import JWT from "jsonwebtoken";
import { PUBLIC_KEY } from "../utils/cert";


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Missing or invalid Authorization header"
            });
        };
        const token = authHeader.slice(7);

        const decoded = JWT.verify(token, PUBLIC_KEY, {
            algorithms: ["RS256"]
        });

        (req as any).user = decoded;

        next();
    } catch (error: any) {
        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}