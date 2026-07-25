import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, LogOut, Download, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listLeads, updateLeadStatus } from "@/lib/leads.functions";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/lead-schemas";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — LeadDesk Mini" },
      { name: "description", content: "Manage inbound leads." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/auth" });
      } else {
        setEmail(data.session.user.email ?? null);
        setAuthChecked(true);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!authChecked) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return <Dashboard email={email} />;
}

function Dashboard({ email }: { email: string | null }) {
  const fetchLeads = useServerFn(listLeads);
  const updateStatus = useServerFn(updateLeadStatus);
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leads", page],
    queryFn: () => fetchLeads({ data: { page, limit } }),
  });

  const leads = response?.leads ?? [];
  const totalLeads = response?.total ?? 0;

  const mutation = useMutation({
    mutationFn: (vars: { id: string; status: LeadStatus }) =>
      updateStatus({ data: vars }),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["leads", page] });
      const prev = qc.getQueryData<{ leads: Lead[]; total: number }>(["leads", page]);
      qc.setQueryData<{ leads: Lead[]; total: number }>(["leads", page], (old) => {
        if (!old) return { leads: [], total: 0 };
        return {
          ...old,
          leads: old.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        };
      });
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads", page], ctx.prev);
      toast.error(err instanceof Error ? err.message : "Update failed");
    },
    onSuccess: () => toast.success("Status updated"),
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (statusFilter !== "All" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.budget.toLowerCase().includes(q)
      );
    });
  }, [leads, query, statusFilter]);

  const stats = useMemo(() => {
    const by = { New: 0, Contacted: 0, Closed: 0 } as Record<LeadStatus, number>;
    for (const l of leads) by[l.status]++;
    return { total: totalLeads, ...by }; // Display actual total from DB
  }, [leads, totalLeads]);

  const exportCsv = () => {
    const header = ["id", "name", "email", "budget", "status", "message", "created_at"];
    const rows = filtered.map((l) =>
      header.map((k) => `"${String(l[k as keyof Lead]).replace(/"/g, '""')}"`).join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold">
            LeadDesk <span className="text-muted-foreground">/ admin</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {email && <span className="text-muted-foreground">{email}</span>}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-accent"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="New" value={stats.New} tone="new" />
          <StatCard label="Contacted" value={stats.Contacted} tone="contacted" />
          <StatCard label="Closed" value={stats.Closed} tone="closed" />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or budget…"
              className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | "All")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="All">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={!filtered.length}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50"
          >
            <Download className="size-4" /> CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading leads…</div>
          ) : isError ? (
            <div className="p-10 text-center text-sm text-destructive">
              Couldn't load leads. {error instanceof Error ? error.message : String(error)}
              <br />
              <button onClick={() => refetch()} className="underline mt-2">
                Retry
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasLeads={leads.length > 0} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Budget</Th>
                    <Th className="max-w-sm">Message</Th>
                    <Th>Status</Th>
                    <Th>Submitted</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((l) => (
                    <tr key={l.id} className="hover:bg-muted/30">
                      <Td className="font-medium text-foreground">{l.name}</Td>
                      <Td>
                        <a
                          href={`mailto:${l.email}`}
                          className="text-primary hover:underline"
                        >
                          {l.email}
                        </a>
                      </Td>
                      <Td>{l.budget}</Td>
                      <Td className="max-w-sm">
                        <p className="line-clamp-2 text-muted-foreground" title={l.message}>
                          {l.message}
                        </p>
                      </Td>
                      <Td>
                        <StatusSelect
                          value={l.status}
                          disabled={mutation.isPending}
                          onChange={(status) => mutation.mutate({ id: l.id, status })}
                        />
                      </Td>
                      <Td className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(l.created_at), "MMM d, yyyy · HH:mm")}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalLeads > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {Math.max(1, Math.ceil(totalLeads / limit))}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * limit >= totalLeads}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "new" | "contacted" | "closed";
}) {
  const dot =
    tone === "new"
      ? "bg-primary"
      : tone === "contacted"
        ? "bg-warning"
        : tone === "closed"
          ? "bg-success"
          : "bg-muted-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <span className={`size-2 rounded-full ${dot}`} />
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: LeadStatus;
  onChange: (s: LeadStatus) => void;
  disabled?: boolean;
}) {
  const tone =
    value === "New"
      ? "border-primary/40 text-primary bg-primary/5"
      : value === "Contacted"
        ? "border-warning/50 text-warning-foreground bg-warning/10"
        : "border-success/40 text-success bg-success/10";
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as LeadStatus)}
      className={`rounded-full border px-3 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-ring/40 ${tone}`}
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s} className="bg-background text-foreground">
          {s}
        </option>
      ))}
    </select>
  );
}

function EmptyState({ hasLeads }: { hasLeads: boolean }) {
  return (
    <div className="grid place-items-center p-16 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {hasLeads ? "No leads match your filters" : "No leads yet"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasLeads
          ? "Try clearing the search or status filter."
          : "Submissions from your landing page will show up here in real time."}
      </p>
    </div>
  );
}
