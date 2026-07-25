import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, LogOut, Download, Inbox, Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listLeads, updateLeadStatus } from "@/lib/leads.functions";
import { getTeamAdmins, addTeamAdmin } from "@/lib/team.functions";
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
  const [activeTab, setActiveTab] = useState<"inbox" | "team">("inbox");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="text-lg font-semibold flex items-center gap-2">
            LeadDesk <span className="text-muted-foreground font-normal">/ admin</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {email && <span className="text-muted-foreground hidden sm:inline-block">{email}</span>}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 hover:bg-accent transition-colors"
            >
              <LogOut className="size-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 flex items-center gap-6">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`border-b-2 py-3 text-sm font-medium transition-colors ${
              activeTab === "inbox" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`border-b-2 py-3 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "team" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            Team <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">New</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === "inbox" ? <InboxTab /> : <TeamTab />}
      </main>
    </div>
  );
}

function InboxTab() {
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
    <div>
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
    </div>
  );
}

function TeamTab() {
  const fetchAdmins = useServerFn(getTeamAdmins);
  const addAdminFn = useServerFn(addTeamAdmin);
  const qc = useQueryClient();
  const [newEmail, setNewEmail] = useState("");

  const { data: admins, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["admins"],
    queryFn: () => fetchAdmins(),
  });

  const mutation = useMutation({
    mutationFn: (email: string) => addAdminFn({ data: { email } }),
    onSuccess: () => {
      toast.success("Admin added successfully!");
      setNewEmail("");
      qc.invalidateQueries({ queryKey: ["admins"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add admin");
    },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">Team Management</h2>
        <p className="mt-2 text-muted-foreground">
          View and manage the administrators who have access to LeadDesk Mini.
        </p>
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border p-6 bg-muted/20">
          <h3 className="font-medium">Add new admin</h3>
          <p className="mt-1 text-sm text-muted-foreground mb-4">
            The person must have signed in to this application at least once before you can grant them admin access.
          </p>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (newEmail.trim()) {
                mutation.mutate(newEmail.trim());
              }
            }}
            className="flex gap-3 items-end"
          >
            <div className="flex-1 max-w-sm">
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="coworker@company.com"
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </div>
            <button
              type="submit"
              disabled={mutation.isPending || !newEmail.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? "Adding..." : (
                <>
                  <UserPlus className="size-4" /> Add Admin
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading team...</div>
          ) : isError ? (
            <div className="p-8 text-center text-sm text-destructive">
              Couldn't load team. {error instanceof Error ? error.message : String(error)}
              <br />
              <button onClick={() => refetch()} className="underline mt-2">Retry</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <Th>Email</Th>
                  <Th>Role</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {admins?.map((admin) => (
                  <tr key={admin.user_id} className="hover:bg-muted/20">
                    <Td className="font-medium flex items-center gap-2">
                      <div className="size-6 rounded-full bg-primary/10 text-primary grid place-items-center uppercase text-[10px] font-bold">
                        {admin.email.charAt(0)}
                      </div>
                      {admin.email}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Admin
                      </span>
                    </Td>
                  </tr>
                ))}
                {admins?.length === 0 && (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-muted-foreground">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-middle ${className}`}>{children}</td>;
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

