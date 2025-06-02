import { z } from "zod";

const loginSchema = z.object({
  phone: z.string(),

  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export default loginSchema;
