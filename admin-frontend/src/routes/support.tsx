import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { AdminShell } from "../components/AdminShell";
import { DataTable, SectionCard, StatusPill } from "../components/AdminUI";
import { fetchChat, fetchTickets, replyToTicket, type Ticket } from "../api/support";
import { adminHead } from "../lib/head";
import { requireAdminSession } from "../lib/require-admin-session";

export const Route = createFileRoute("/support")({
  beforeLoad: requireAdminSession,
  head: () => adminHead("Support", "Handle QuickPress tickets and live chat from every app."),
  component: SupportPage,
});

function SupportPage() {
  const tickets = useQuery({ queryKey: ["admin", "tickets"], queryFn: fetchTickets });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  const active = selected ?? tickets.data?.[0] ?? null;

  const chat = useQuery({
    queryKey: ["admin", "tickets", active?.id, "chat"],
    queryFn: () => fetchChat(active!.id),
    enabled: Boolean(active),
  });

  const send = useMutation({
    mutationFn: (body: string) => replyToTicket(active!.id, body),
    onSuccess: () => {
      toast.success("Reply sent");
      setReply("");
    },
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (tickets.data ?? []).filter((t) => {
      const matchesQuery = !q || [t.id, t.subject, t.raisedBy].join(" ").toLowerCase().includes(q);
      return matchesQuery && (status === "all" || t.status === status);
    });
  }, [tickets.data, query, status]);

  return (
    <AdminShell title="Support" subtitle="Tickets and live conversations across customers, partners and riders.">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-4">
          <SectionCard>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ticket or requester…"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In progress">In progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          <SectionCard title="Tickets" description={`${rows.length} tickets`}>
            <DataTable
              loading={tickets.isLoading}
              rows={rows}
              onRowClick={setSelected}
              columns={[
                { key: "subject", label: "Subject", render: (r) => (
                  <div>
                    <p className="font-medium text-foreground">{r.subject}</p>
                    <p className="text-xs text-muted-foreground">{r.id} · {r.raisedBy}</p>
                  </div>
                ) },
                { key: "source", label: "Source" },
                { key: "priority", label: "Priority", render: (r) => <StatusPill value={r.priority} /> },
                { key: "assignee", label: "Assignee" },
                { key: "updated", label: "Updated" },
                { key: "status", label: "Status", render: (r) => <StatusPill value={r.status} /> },
              ]}
            />
          </SectionCard>
        </div>

        <SectionCard
          title={active ? active.subject : "Conversation"}
          description={active ? `${active.id} · ${active.raisedBy}` : "Select a ticket"}
        >
          <div className="flex h-[520px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {(chat.data ?? []).map((message) => (
                <div
                  key={message.id}
                  className={message.me ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.me
                        ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground"
                        : "max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-foreground"
                    }
                  >
                    <p className="text-xs opacity-70">{message.author} · {message.at}</p>
                    <p className="mt-1">{message.body}</p>
                  </div>
                </div>
              ))}
              {chat.isLoading ? <p className="text-sm text-muted-foreground">Loading conversation…</p> : null}
            </div>

            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              <Input
                value={reply}
                placeholder="Type a reply…"
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reply.trim()) send.mutate(reply.trim());
                }}
              />
              <Button
                size="icon"
                disabled={!reply.trim() || send.isPending}
                onClick={() => send.mutate(reply.trim())}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
