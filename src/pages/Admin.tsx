import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type HelpTicketStatus = "open" | "acknowledged" | "in_progress" | "resolved";

const Admin = () => {
  const { isSuperAdmin, user } = useAuth();
  const { toast } = useToast();

  const [loadingTickets, setLoadingTickets] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<HelpTicketStatus | "all">("open");

  const [loadingRequests, setLoadingRequests] = useState(false);
  const [campusRequests, setCampusRequests] = useState<any[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const [campuses, setCampuses] = useState<any[]>([]);
  const [inviteCampusId, setInviteCampusId] = useState<string>("");
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [latestInvite, setLatestInvite] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const { data, error } = await (supabase as any)
        .from("help_tickets")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setTickets(data ?? []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load tickets", description: e.message });
    } finally {
      setLoadingTickets(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, campusId: string, next: HelpTicketStatus) => {
    try {
      const updates: any = { status: next };
      if (next === "acknowledged") updates.acknowledged_by = user?.id ?? null;
      if (next === "resolved") updates.resolved_at = new Date().toISOString();

      const { error } = await (supabase as any)
        .from("help_tickets")
        .update(updates)
        .eq("id", ticketId)
        .eq("campus_id", campusId);

      if (error) throw error;
      toast({ title: "Updated", description: `Ticket moved to ${next.replace("_", " ")}.` });
      await loadTickets();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update failed", description: e.message });
    }
  };

  const loadCampusRequests = async () => {
    if (!isSuperAdmin) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await (supabase as any)
        .from("campus_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setCampusRequests(data ?? []);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to load university requests", description: e.message });
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadCampuses = async () => {
    // campuses are viewable by everyone (existing policy), used for invite generation UI
    const { data } = await supabase.from("campuses").select("*").order("name");
    setCampuses(data ?? []);
    if (!inviteCampusId && data?.[0]?.id) setInviteCampusId(data[0].id);
  };

  const approveRequest = async (req: any) => {
    try {
      const { data: campus, error: campusErr } = await supabase
        .from("campuses")
        .insert({
          name: req.name,
          city: req.city,
          state: req.state,
          country: req.country,
        })
        .select("*")
        .single();

      if (campusErr) throw campusErr;

      const { error } = await (supabase as any)
        .from("campus_requests")
        .update({
          status: "approved",
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[req.id] ?? null,
          created_campus_id: campus?.id ?? null,
        })
        .eq("id", req.id);
      if (error) throw error;

      toast({ title: "Approved", description: "University added." });
      await Promise.all([loadCampusRequests(), loadCampuses()]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Approve failed", description: e.message });
    }
  };

  const rejectRequest = async (req: any) => {
    try {
      const { error } = await (supabase as any)
        .from("campus_requests")
        .update({
          status: "rejected",
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[req.id] ?? null,
        })
        .eq("id", req.id);
      if (error) throw error;
      toast({ title: "Rejected" });
      await loadCampusRequests();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Reject failed", description: e.message });
    }
  };

  const createInvite = async () => {
    if (!inviteCampusId) return;
    setCreatingInvite(true);
    setLatestInvite(null);
    try {
      const code = `ADM-${crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase()}`;
      const { error } = await (supabase as any)
        .from("admin_invites")
        .insert({
          created_by: user?.id,
          campus_id: inviteCampusId,
          code,
        });
      if (error) throw error;
      setLatestInvite(code);
      toast({ title: "Invite created", description: "Share this code with the admin for that university." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Invite failed", description: e.message });
    } finally {
      setCreatingInvite(false);
    }
  };

  useEffect(() => {
    loadTickets();
    loadCampuses();
    loadCampusRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground">Tickets are visible only for your assigned university.</p>
        </div>

        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className={isSuperAdmin ? "grid w-full max-w-2xl grid-cols-3" : "grid w-full max-w-md grid-cols-1"}>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="universities">Universities</TabsTrigger>}
            {isSuperAdmin && <TabsTrigger value="invites">Invites</TabsTrigger>}
          </TabsList>

          <TabsContent value="tickets" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle>Urgent Help Tickets</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={loadTickets} disabled={loadingTickets}>
                    Refresh
                  </Button>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    aria-label="Status filter"
                  >
                    <option value="all">All</option>
                    <option value="open">Open</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredTickets.map((t) => (
                      <div key={t.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                          <div>
                            <p className="font-medium">{String(t.category).replace("_", " ")} • {String(t.urgency)}</p>
                            <p className="text-sm text-muted-foreground">Status: {String(t.status).replace("_", " ")}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {t.status === "open" && (
                              <Button size="sm" onClick={() => updateTicketStatus(t.id, t.campus_id, "acknowledged")}>Acknowledge</Button>
                            )}
                            {t.status === "acknowledged" && (
                              <Button size="sm" onClick={() => updateTicketStatus(t.id, t.campus_id, "in_progress")}>Start</Button>
                            )}
                            {t.status === "in_progress" && (
                              <Button size="sm" onClick={() => updateTicketStatus(t.id, t.campus_id, "resolved")}>Resolve</Button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm">{t.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="universities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>University Requests</CardTitle>
                  <Button variant="outline" onClick={loadCampusRequests} disabled={loadingRequests}>Refresh</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campusRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No requests.</p>
                  ) : (
                    <div className="space-y-4">
                      {campusRequests.map((r) => (
                        <div key={r.id} className="rounded-lg border border-border p-4 space-y-3">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                            <div>
                              <p className="font-medium">{r.name}</p>
                              <p className="text-sm text-muted-foreground">{r.city}{r.state ? `, ${r.state}` : ""} • {r.country} • {r.status}</p>
                            </div>
                            <div className="flex gap-2">
                              {r.status === "pending" ? (
                                <>
                                  <Button size="sm" onClick={() => approveRequest(r)}>Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => rejectRequest(r)}>Reject</Button>
                                </>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`notes-${r.id}`}>Review notes (optional)</Label>
                            <Textarea
                              id={`notes-${r.id}`}
                              value={reviewNotes[r.id] ?? ""}
                              onChange={(e) => setReviewNotes((p) => ({ ...p, [r.id]: e.target.value }))}
                              placeholder="Add a note for your records"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isSuperAdmin && (
            <TabsContent value="invites" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create Admin Invite (single university)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campus">University</Label>
                    <select
                      id="campus"
                      value={inviteCampusId}
                      onChange={(e) => setInviteCampusId(e.target.value)}
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <Button onClick={createInvite} disabled={creatingInvite || !inviteCampusId}>
                    {creatingInvite ? "Creating…" : "Create invite code"}
                  </Button>

                  {latestInvite && (
                    <div className="rounded-lg border border-border p-4 space-y-2">
                      <p className="text-sm text-muted-foreground">Share this code with the admin:</p>
                      <Input value={latestInvite} readOnly />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;
