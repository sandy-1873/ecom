"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userSchema_1 = __importDefault(require("../types/userSchema"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const userRoutes = (0, express_1.default)();
userRoutes.post("/register", async (req, res) => {
    const data = req.body;
    const result = userSchema_1.default.safeParse(data);
    if (result.error) {
        const issues = zod_1.z.treeifyError(result.error);
        if (issues) {
            console.log(issues);
            return res.status(400).json({
                message: issues.properties,
            });
        }
    }
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            password: data.password,
        }
    });
    const { password: _, ...returnableUser } = user;
    return res.status(200).json({
        user: returnableUser,
        message: "User registered successfully"
    });
});
userRoutes.post("/login", (req, res) => {
    res.send("login a new user");
});
userRoutes.get("/:id", (req, res) => {
    res.send(`Get user with ID ${req.params.id}`);
});
userRoutes.put("/:id", (req, res) => {
    res.send(`Update user with ID ${req.params.id}`);
});
userRoutes.delete("/:id", (req, res) => {
    res.send(`Delete user with ID ${req.params.id}`);
});
exports.default = userRoutes;
