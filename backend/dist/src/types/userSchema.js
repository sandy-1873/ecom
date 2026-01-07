"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const userSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    firstname: zod_1.z.string().min(1, "First name is required").max(50),
    lastname: zod_1.z.string().min(1, "Last name is required").max(50),
    phonenumber: zod_1.z
        .string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
        .optional()
        .or(zod_1.z.literal('')),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: zod_1.z.string()
})
    .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
exports.default = userSchema;
