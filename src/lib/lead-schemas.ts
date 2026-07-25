import { z } from "zod";

export const BUDGET_RANGES = [
  "<$1k",
  "$1k-$5k",
  "$5k-$25k",
  "$25k-$100k",
  "$100k+",
] as const;
export type BudgetRange = (typeof BUDGET_RANGES)[number];

export const LEAD_STATUSES = ["New", "Contacted", "Closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  budget: z.enum(BUDGET_RANGES, { message: "Select a budget range" }),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be under 1000 characters"),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES),
});

export type Lead = {
  id: string;
  name: string;
  email: string;
  budget: BudgetRange;
  message: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
};
