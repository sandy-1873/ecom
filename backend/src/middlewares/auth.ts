import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const userTokenValidator = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).send("Unauthorized request");
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        (req as any).user = decoded;
        next();
    } catch (err) {
        return res.status(401).send("Invalid or expired token");
    }
}

export default userTokenValidator;