import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const getTeamAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .rpc("get_all_admins");

    if (error) {
      throw new Error(error.message);
    }
    
    return data as { user_id: string; email: string }[];
  });

const addAdminSchema = z.object({
  email: z.string().email("Please provide a valid email"),
});

export const addTeamAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => addAdminSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: success, error } = await context.supabase
      .rpc("make_user_admin_by_email", { user_email: data.email });

    if (error) {
      throw new Error(error.message);
    }

    return { success };
  });
