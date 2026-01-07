import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstname: z.string().min(1, "First name is required").max(50),
  lastname: z.string().min(1, "Last name is required").max(50),
  phonenumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
    .optional()
    .or(z.literal('')), 
  password: z.string().min(8, "Password must be at least 8 characters long"),
  confirmPassword: z.string()
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default userSchema;