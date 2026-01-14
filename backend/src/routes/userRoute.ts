import express, {Request, Response} from "express";
import userTokenValidator from "../middlewares/auth";
import userSchema from "../types/userSchema";
import {z} from "zod";
import {prisma} from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt, {JwtPayload} from "jsonwebtoken";
import "dotenv/config";
import {validateUserAccess} from "../lib/validateUserAccess";

const userRoutes = express();

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
        const {password: _, ...returnableUser} = user;

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
    const {email, password} = req.body;

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
    const refreshToken = jwt.sign({email}, process.env.REFRESH_TOKEN_SECRET!, {expiresIn: '1d'});
    const token = jwt.sign({email}, process.env.JWT_SECRET!, {
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

userRoutes.get("/:id", userTokenValidator, async (req, res) => {
    try {
        const user = await validateUserAccess(req);

        const {password: _, ...returnableUser} = user;

        res.status(200).json({
            message: "User fetched successfully",
            user: returnableUser,
        });
    } catch (err: any) {
        res.status(err.status || 500).json({
            message: err.message || "Something went wrong",
        });
    }
});

userRoutes.patch("/:id", userTokenValidator, async (req, res) => {
    try {
        await validateUserAccess(req);

        const {userEmail, password, firstname, lastname, phonenumber} = req.body;

        const updateData: any = {};

        if (firstname !== undefined) updateData.firstname = firstname;
        if (lastname !== undefined) updateData.lastname = lastname;
        if (phonenumber !== undefined) updateData.phonenumber = phonenumber;
        if (userEmail !== undefined) updateData.email = userEmail;

        if (password !== undefined) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password, salt);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No fields provided to update",
            });
        }

        const updatedUser = await prisma.user.update({
            where: {id: req.params.id},
            data: updateData,
        });

        const {password: _, ...returnableUser} = updatedUser;

        res.status(200).json({
            message: "User updated successfully",
            user: returnableUser,
        });
    } catch (err: any) {
        res.status(err.status || 500).json({
            message: err.message || "Something went wrong",
        });
    }
});

userRoutes.delete("/:id", userTokenValidator, async (req, res) => {
    try {
        await validateUserAccess(req);

        await prisma.user.delete({
            where: {id: req.params.id},
        });

        res.status(200).json({
            message: "User deleted successfully",
        });
    } catch (err: any) {
        res.status(err.status || 500).json({
            message: err.message || "Something went wrong",
        });
    }
});

export default userRoutes;
