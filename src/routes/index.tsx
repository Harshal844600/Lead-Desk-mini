import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, LineChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BUDGET_RANGES,
  createLeadSchema,
  type CreateLeadInput,
} from "@/lib/lead-schemas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LeadDesk Mini — capture leads that convert" },
      {
        name: "description",
        content:
          "A crisp landing page and admin desk for capturing, qualifying, and closing inbound leads. Built for small teams that ship.",
      },
      { property: "og:title", content: "LeadDesk Mini — capture leads that convert" },
      {
        property: "og:description",
        content: "A crisp landing page and admin desk for inbound leads.",
      },
    ],
  }),
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

function LandingPage() {
  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <LeadFormSection />
        <SiteFooter />
      </main>
    </div>
  );
}

function SiteHeader() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-foreground group">
          <motion.span 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm"
          >
            <Sparkles className="size-4" />
          </motion.span>
          <span className="text-lg font-semibold tracking-tight">LeadDesk</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#capture" className="text-muted-foreground transition-colors hover:text-foreground">
            Get in touch
          </a>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-card/50 px-4 py-1.5 text-sm font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-accent hover:border-accent-foreground/20"
          >
            Admin
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}

function Hero() {
  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:py-40">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
            </span>
            New — built for the way small teams sell
          </motion.span>
          
          <motion.h1 variants={fadeUp} className="mt-8 text-5xl font-extrabold tracking-tight text-foreground sm:text-7xl">
            Capture leads.
            <br />
            <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Close them faster.</em>
          </motion.h1>
          
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground sm:text-xl">
            LeadDesk Mini turns visitors into qualified conversations. A polished landing form on
            the front, a focused admin desk on the back. Nothing else.
          </motion.p>
          
          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
            <motion.a
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="#capture"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elevated transition-colors hover:bg-primary/90"
            >
              Talk to sales
              <ArrowRight className="size-4" />
            </motion.a>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Open admin dashboard
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      icon: LineChart,
      title: "One inbox for pipeline",
      body: "Every submission lands in a searchable table with status badges you can update in one click.",
    },
    {
      icon: ShieldCheck,
      title: "Validated end-to-end",
      body: "Client- and server-side Zod schemas keep bad data out and give your team clean records.",
    },
    {
      icon: Sparkles,
      title: "Feels premium",
      body: "A typography-forward landing page with a fast, accessible form. No dark patterns.",
    },
  ];
  return (
    <section id="features" className="border-y border-border/30 bg-card/20 relative z-10">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-8 sm:grid-cols-3"
        >
          {items.map(({ icon: Icon, title, body }) => (
            <motion.div 
              key={title} 
              variants={fadeUp}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="group rounded-3xl border border-border/50 bg-card/60 backdrop-blur-md p-8 shadow-sm transition-all hover:shadow-elevated hover:border-primary/30"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-3 text-base text-muted-foreground leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function LeadFormSection() {
  return (
    <section id="capture" className="relative mx-auto max-w-6xl px-6 py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background"></div>
      <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-6xl">
            Tell us about your project.
          </h2>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground">
            Share a few details and someone on our team will follow up within one business day.
            No newsletters, no drip campaigns — just a real conversation.
          </p>
          <ul className="mt-10 space-y-4 text-base font-medium text-foreground/80">
            {[
              "Human reply within 1 business day",
              "No automated follow-ups",
              "We only use your info to reply to this inquiry",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <div className="flex size-6 items-center justify-center rounded-full bg-success/20">
                  <CheckCircle2 className="size-4 text-success" />
                </div>
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        >
          <LeadForm />
        </motion.div>
      </div>
    </section>
  );
}

import { Turnstile } from "@marsidev/react-turnstile";

function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { name: "", email: "", budget: undefined as unknown as CreateLeadInput["budget"], message: "", turnstileToken: "" },
  });

  const onSubmit = async (values: CreateLeadInput) => {
    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Submission failed");
      }
      setSubmitted(true);
      reset();
      toast.success("Thanks! We'll be in touch shortly.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-1 shadow-elevated backdrop-blur-xl">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="flex h-full min-h-[400px] flex-col items-center justify-center p-10 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="grid size-20 place-items-center rounded-full bg-success/10 text-success mb-6"
            >
              <CheckCircle2 className="size-10" />
            </motion.div>
            <h3 className="text-3xl font-bold text-foreground">Message received</h3>
            <p className="mt-4 text-lg text-muted-foreground">
              We've logged your inquiry and someone will reach out shortly.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Submit another response
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-[1.75rem] bg-card p-8 sm:p-10"
          >
            <div className="space-y-6">
              <Field label="Name" error={errors.name?.message} htmlFor="name">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register("name")}
                  className="input"
                  placeholder="Ada Lovelace"
                />
              </Field>
              <Field label="Work email" error={errors.email?.message} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  className="input"
                  placeholder="ada@company.com"
                />
              </Field>
              <Field label="Budget range" error={errors.budget?.message} htmlFor="budget">
                <div className="relative">
                  <select id="budget" {...register("budget")} className="input appearance-none" defaultValue="">
                    <option value="" disabled>
                      Select a range
                    </option>
                    {BUDGET_RANGES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-muted-foreground">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </Field>
              <Field label="How can we help?" error={errors.message?.message} htmlFor="message">
                <textarea
                  id="message"
                  rows={4}
                  {...register("message")}
                  className="input resize-none"
                  placeholder="A few sentences about the project, timeline, and goals."
                />
              </Field>

              {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                <div className="py-2">
                  <Turnstile 
                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                    onSuccess={(token) => setValue("turnstileToken", token)} 
                  />
                  {errors.turnstileToken && <p className="text-sm text-destructive mt-1">{errors.turnstileToken.message}</p>}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send message"}
                {!isSubmitting && <ArrowRight className="size-5" />}
              </motion.button>
            </div>

            <style>{`
              .input {
                width: 100%;
                border-radius: var(--radius-lg);
                border: 2px solid transparent;
                background: var(--color-background);
                color: var(--color-foreground);
                padding: 0.85rem 1rem;
                font-size: 0.95rem;
                font-weight: 500;
                transition: all 200ms ease;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) inset;
              }
              .input:hover {
                background: var(--color-accent);
              }
              .input:focus {
                outline: none;
                background: var(--color-background);
                border-color: var(--color-primary);
                box-shadow: 0 0 0 4px oklch(from var(--color-primary) l c h / 0.15);
              }
              .input::placeholder {
                color: var(--color-muted-foreground);
                opacity: 0.7;
              }
            `}</style>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-semibold text-foreground/90">
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0, mt: 0 }}
            animate={{ opacity: 1, height: "auto", mt: 8 }}
            exit={{ opacity: 0, height: 0, mt: 0 }}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/40 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm font-medium text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} LeadDesk Mini. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Built with <span className="text-foreground">TanStack Start</span>
        </p>
      </div>
    </footer>
  );
}
