import { z } from "zod";
// full_name, phone, email, bank_name, bank_account_num, bank_ifsc_code, dob, address, pin_code, district, state, area, aadhar_num, pan_num
const profileSchema = z.object({
  full_name: z
    .string()
    .min(3, "Full name must be at least 3 characters")
    .optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  bank_name: z.string().optional(),
  bank_account_num: z.string().optional(),
  bank_ifsc_code: z.string().optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  pin_code: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  area: z.string().optional(),
  aadhar_num: z.string().optional(),
  pan_num: z.string().optional(),
});

export default profileSchema;
