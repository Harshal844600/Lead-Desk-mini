import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CheckCircle2, Sparkles, ShieldCheck, LineChart } from "lucide-react";
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

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
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
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <span className="text-lg font-semibold tracking-tight">LeadDesk</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <a href="#features" className="text-muted-foreground hover:text-foreground">
            Features
          </a>
          <a href="#capture" className="text-muted-foreground hover:text-foreground">
            Get in touch
          </a>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero-bg relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            New — built for the way small teams sell
          </span>
          <h1 className="mt-6 text-5xl leading-[1.05] text-foreground sm:text-7xl">
            Capture leads.
            <br />
            <em className="not-italic text-primary">Close them faster.</em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            LeadDesk Mini turns visitors into qualified conversations. A polished landing form on
            the front, a focused admin desk on the back. Nothing else.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#capture"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevated transition-transform hover:-translate-y-0.5"
            >
              Talk to sales
              <ArrowRight className="size-4" />
            </a>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
            >
              Open admin dashboard
            </Link>
          </div>
        </div>
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
    <section id="features" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-xl text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadFormSection() {
  return (
    <section id="capture" className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        <div>
          <h2 className="text-4xl text-foreground sm:text-5xl">
            Tell us about your project.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Share a few details and someone on our team will follow up within one business day.
            No newsletters, no drip campaigns — just a real conversation.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            {[
              "Human reply within 1 business day",
              "No automated follow-ups",
              "We only use your info to reply to this inquiry",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-success" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <LeadForm />
      </div>
    </section>
  );
}

function LeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: { name: "", email: "", budget: undefined as unknown as CreateLeadInput["budget"], message: "" },
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

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-elevated">
        <div className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-6" />
        </div>
        <h3 className="mt-4 text-2xl text-foreground">Message received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We've logged your inquiry and someone will reach out shortly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-2xl border border-border bg-card p-6 shadow-elevated sm:p-8"
    >
      <div className="space-y-5">
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
          <select id="budget" {...register("budget")} className="input" defaultValue="">
            <option value="" disabled>
              Select a range
            </option>
            {BUDGET_RANGES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send message"}
          {!isSubmitting && <ArrowRight className="size-4" />}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-input);
          background: var(--color-background);
          color: var(--color-foreground);
          padding: 0.65rem 0.85rem;
          font-size: 0.925rem;
          transition: border-color 120ms, box-shadow 120ms;
        }
        .input:focus {
          outline: none;
          border-color: var(--color-ring);
          box-shadow: 0 0 0 3px oklch(from var(--color-ring) l c h / 0.2);
        }
      `}</style>
    </form>
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
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} LeadDesk Mini</p>
        <p>Built with TanStack Start · Lovable Cloud</p>
      </div>
    </footer>
  );
}
