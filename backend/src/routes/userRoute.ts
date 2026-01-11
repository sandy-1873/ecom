import express, { Request, Response } from "express";
import userTokenValidator from "../middlewares/auth";
import userSchema from "../types/userSchema";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt, {JwtPayload} from "jsonwebtoken";
import "dotenv/config";
const userRoutes = express();

interface AuthPayload extends JwtPayload {
    email: string;
}

userRoutes.post("/register", async (req: Request, res: Response) => {
    const data = req.body;
    const result = userSchema.safeParse(data);
    if (result.error) {
        const issues = z.treeifyError(result.error!);
        if (issues) {
            console.log(issues);
            return res.status(400).json({
                message: issues.properties,
            })
        }
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        const user = await prisma.user.create({
            data: {
                email: data.email,
                firstname: data.firstname,
                lastname: data.lastname,
                password: hashedPassword,
                phonenumber: data.phonenumber,
            }
        });
        const { password: _, ...returnableUser } = user;

        return res.status(200).json({
            user: returnableUser,
            message: "User registered successfully"
        });
    } catch (e: any) {
        return res.status(400).json({
            message: e.message,
        })
    }
});

userRoutes.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email or password is required",
        })
    }

    const user = await prisma.user.findFirst({
        where: {
            email: email,
        }
    });
    if (!user) {
        return res.status(400).json({
            message: "Account does not exist",
        })
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        return res.status(400).json({
            message: "Invalid credentials",
        })
    }
    const refreshToken = jwt.sign({ email }, process.env.REFRESH_TOKEN_SECRET!, { expiresIn: '1d' });
    const token = jwt.sign({ email }, process.env.JWT_SECRET!, {
        expiresIn: '2h'
    });
    res.cookie('refresh', refreshToken, {
        httpOnly: true,
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
    });
    return res.status(200).json({
        token: token,
    })
});

userRoutes.get("/:id", userTokenValidator, (req, res) => {
    const userId = req.params.id;
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) {
        return res.status(401).json({
            message: "Invalid token",
        })
    }
    const jwtDecoded = jwt.decode(token);
    console.log(jwtDecoded);
    res.send(`Get user with ID ${req.params.id}`);
});

userRoutes.patch("/:id", userTokenValidator, async (req, res) => {
    const userId = req.params.id;

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;

    if (!token) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
    ) as AuthPayload;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        return res.status(401).json({ message: "User does not exist" });
    }

    if (user.email !== decoded.email) {
        return res.status(401).json({ message: "Invalid user" });
    }

    const { userEmail, password, firstname, lastname, phonenumber } = req.body;

    // 👇 build update object dynamically
    const updateData: any = {};

    if (firstname !== undefined) updateData.firstname = firstname;
    if (lastname !== undefined) updateData.lastname = lastname;
    if (phonenumber !== undefined) updateData.phonenumber = phonenumber;
    if (userEmail !== undefined) updateData.email = userEmail;

    if (password !== undefined) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
    }

    // Optional: prevent empty updates
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
            message: "No fields provided to update",
        });
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });

    const { password: _, ...returnableUser } = updatedUser;

    res.status(200).json({
        message: "User updated successfully",
        user: returnableUser,
    });
});

userRoutes.delete("/:id", userTokenValidator, (req, res) => {
    res.send(`Delete user with ID ${req.params.id}`);
});

export default userRoutes;
