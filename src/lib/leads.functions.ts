// Authenticated server functions for the admin dashboard.
// RLS scopes access — only signed-in users can list or update leads.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { updateLeadStatusSchema, type Lead } from "./lead-schemas";

export const listLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Lead[]> => {
    const { data, error } = await context.supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Lead[];
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
