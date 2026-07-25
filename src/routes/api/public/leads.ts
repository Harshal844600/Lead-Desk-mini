// POST /api/public/leads — public lead capture endpoint.
// Validates with Zod, inserts via the anon Supabase client (RLS permits INSERT
// for anon on public.leads). Returns JSON with correct HTTP status codes.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createLeadSchema } from "@/lib/lead-schemas";
import type { Database } from "@/integrations/supabase/types";

const jsonHeaders = { "Content-Type": "application/json" } as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

export const Route = createFileRoute("/api/public/leads")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const parsed = createLeadSchema.safeParse(body);
        if (!parsed.success) {
          return json(
            {
              error: "Validation failed",
              issues: parsed.error.issues.map((i) => ({
                path: i.path.join("."),
                message: i.message,
              })),
            },
            422,
          );
        }

        const url = process.env.SUPABASE_URL!;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                h.delete("Authorization");
              }
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const { data, error } = await supabase
          .from("leads")
          .insert(parsed.data)
          .select("id, created_at")
          .single();

        if (error) {
          console.error("[POST /api/public/leads] insert failed", error);
          return json({ error: "Could not save lead" }, 500);
        }

        return json({ ok: true, id: data.id, created_at: data.created_at }, 201);
      },
    },
  },
});
