import jwt, {JwtPayload} from "jsonwebtoken";
import { Request } from "express";
import { prisma } from "../lib/prisma";

interface AuthPayload extends JwtPayload {
    email: string;
}

export const validateUserAccess = async (req: Request) => {
    const userId = req.params.id;

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) {
        throw { status: 401, message: "Invalid token" };
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
    ) as AuthPayload;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw { status: 404, message: "User does not exist" };
    }

    if (user.email !== decoded.email) {
        throw { status: 403, message: "Unauthorized access" };
    }

    return user;
};
