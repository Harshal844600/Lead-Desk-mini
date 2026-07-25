// Authenticated server functions for the admin dashboard.
// RLS scopes access — only signed-in users can list or update leads.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { updateLeadStatusSchema, type Lead } from "./lead-schemas";

import { z } from "zod";

const listLeadsSchema = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
});

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => listLeadsSchema.parse(input || {}))
  .handler(async ({ data, context }): Promise<{ leads: Lead[]; total: number }> => {
    const page = data.page || 1;
    const limit = data.limit || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data: leads, error, count } = await context.supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
      
    if (error) {
      import("@sentry/node").then((Sentry) => Sentry.captureException(error));
      throw new Error(error.message);
    }
    
    return { leads: (leads ?? []) as Lead[], total: count ?? 0 };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateLeadStatusSchema.parse(input))
  .handler(async ({ data, context }): Promise<Lead> => {
    const { data: row, error } = await context.supabase
      .from("leads")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Lead;
  });
