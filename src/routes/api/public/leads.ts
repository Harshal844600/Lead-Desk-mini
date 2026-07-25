import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createLeadSchema } from "@/lib/lead-schemas";
import type { Database } from "@/integrations/supabase/types";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/node";

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

        // Rate Limiting (Upstash)
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
          try {
            const ip = request.headers.get("x-forwarded-for") || "unknown";
            const redis = new Redis({
              url: process.env.UPSTASH_REDIS_REST_URL,
              token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });
            const ratelimit = new Ratelimit({
              redis,
              limiter: Ratelimit.slidingWindow(5, "1 m"),
              analytics: true,
            });
            const { success } = await ratelimit.limit(`ratelimit_leads_${ip}`);
            if (!success) {
              return json({ error: "Too many requests. Please try again later." }, 429);
            }
          } catch (error) {
            console.error("Rate limit check failed", error);
            Sentry.captureException(error);
          }
        }

        const { turnstileToken, ...insertData } = parsed.data;

        // Turnstile Captcha
        if (process.env.TURNSTILE_SECRET_KEY) {
          if (!turnstileToken) {
            return json({ error: "Captcha token missing" }, 400);
          }
          try {
            const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstileToken,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyJson.success) {
              return json({ error: "Captcha validation failed" }, 400);
            }
          } catch (error) {
            console.error("Turnstile verification failed", error);
            Sentry.captureException(error);
            return json({ error: "Failed to verify captcha" }, 500);
          }
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
          .insert(insertData)
          .select("id, created_at")
          .single();

        if (error) {
          console.error("[POST /api/public/leads] insert failed", error);
          Sentry.captureException(error);
          return json({ error: "Could not save lead: " + error.message }, 500);
        }

        return json({ ok: true, id: data.id, created_at: data.created_at }, 201);
      },
    },
  },
});
