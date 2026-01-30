import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarIcon, Download, Shield, Car, ShoppingBag, MessageSquare } from "lucide-react";

import Layout from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { downloadCsv } from "@/lib/csv";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { HelpTicketChatDialog } from "@/components/help/HelpTicketChatDialog";

type CampusRow = { id: string; name: string; city: string; state: string | null; country: string };

function startOfDayIso(d: Date) {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
}

function endOfDayIso(d: Date) {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt.toISOString();
}

export default function Admin() {
  const { user, profile } = useAuth();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin(Boolean(user));

  const [fromDate, setFromDate] = useState<Date>(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const [toDate, setToDate] = useState<Date>(() => new Date());

  const { data: campuses } = useQuery({
    queryKey: ["admin_accessible_campuses"],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_accessible_campuses");
      if (error) throw error;
      return (data ?? []) as CampusRow[];
    },
  });

  const defaultCampusId = useMemo(() => {
    return campuses?.[0]?.id ?? profile?.campus_id ?? null;
  }, [campuses, profile?.campus_id]);

  const [campusId, setCampusId] = useState<string | null>(null);
  const effectiveCampusId = campusId ?? defaultCampusId;

  const range = useMemo(
    () => ({ from: startOfDayIso(fromDate), to: endOfDayIso(toDate) }),
    [fromDate, toDate],
  );

  const summaryQuery = useQuery({
    queryKey: ["admin_summary", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_dashboard_summary", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return data as any;
    },
  });

  const helpQuery = useQuery({
    queryKey: ["admin_help", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_help_tickets", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const travelQuery = useQuery({
    queryKey: ["admin_travel", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_travel_posts", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const errandsQuery = useQuery({
    queryKey: ["admin_errands", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_errands", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const carpoolReqQuery = useQuery({
    queryKey: ["admin_carpool_requests", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_carpool_requests", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const errandReqQuery = useQuery({
    queryKey: ["admin_errand_requests", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_errand_requests", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const helpChatQuery = useQuery({
    queryKey: ["admin_help_chat", effectiveCampusId, range.from, range.to],
    enabled: Boolean(user && effectiveCampusId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_export_help_ticket_messages", {
        _campus_id: effectiveCampusId,
        _from: range.from,
        _to: range.to,
      } as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  if (!user) return <Navigate to="/" replace />;
  if (isAdminLoading) return null;
  if (!isAdmin) return <Navigate to="/home" replace />;

  const campusLabel = campuses?.find((c) => c.id === effectiveCampusId);
  const filenameRange = `${format(fromDate, "yyyy-MM-dd")}_to_${format(toDate, "yyyy-MM-dd")}`;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-sm text-muted-foreground">Campus-scoped reporting and CSV exports.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Campus</p>
              <Select value={effectiveCampusId ?? undefined} onValueChange={(v) => setCampusId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {(campuses ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} • {c.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">From</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(fromDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={(d) => d && setFromDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">To</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(toDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={toDate} onSelect={(d) => d && setToDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2"><Shield className="h-4 w-4" />Help</TabsTrigger>
            <TabsTrigger value="carpooling" className="flex items-center gap-2"><Car className="h-4 w-4" />Carpooling</TabsTrigger>
            <TabsTrigger value="errands" className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Errands</TabsTrigger>
            <TabsTrigger value="chats" className="flex items-center gap-2"><MessageSquare className="h-4 w-4" />Chats</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader><CardTitle className="text-base">Help</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">Campus: {campusLabel?.name ?? "—"}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Total: {summaryQuery.data?.help?.total ?? 0}</Badge>
                    <Badge variant="outline">Open: {summaryQuery.data?.help?.open ?? 0}</Badge>
                    <Badge variant="outline">Ack: {summaryQuery.data?.help?.acknowledged ?? 0}</Badge>
                    <Badge variant="outline">Resolved: {summaryQuery.data?.help?.resolved ?? 0}</Badge>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Carpooling</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Posts: {summaryQuery.data?.carpooling?.travel_posts_created ?? 0}</Badge>
                  <Badge variant="outline">Active: {summaryQuery.data?.carpooling?.travel_posts_active ?? 0}</Badge>
                  <Badge variant="outline">Requests: {summaryQuery.data?.carpooling?.carpool_requests ?? 0}</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Errands</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Posts: {summaryQuery.data?.errands?.errands_created ?? 0}</Badge>
                  <Badge variant="outline">Active: {summaryQuery.data?.errands?.errands_active ?? 0}</Badge>
                  <Badge variant="outline">Requests: {summaryQuery.data?.errands?.errand_requests ?? 0}</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => downloadCsv(`help_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, helpQuery.data ?? [])}
                disabled={!helpQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Help Tickets (preview - showing latest 20)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total tickets in range: {helpQuery.data?.length ?? 0}
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Chat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(helpQuery.data ?? []).slice(0, 20).map((r) => (
                      <TableRow key={r.ticket_id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(r.created_at), "PPp")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{r.requester_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{r.requester_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{String(r.category).replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <Badge variant={r.urgency === 'critical' ? 'destructive' : r.urgency === 'high' ? 'default' : 'secondary'}>
                            {String(r.urgency).replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'resolved' ? 'outline' : r.status === 'open' ? 'destructive' : 'secondary'}>
                            {String(r.status).replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <HelpTicketChatDialog ticketId={r.ticket_id} triggerLabel="Open" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carpooling" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => downloadCsv(`carpooling_posts_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, travelQuery.data ?? [])}
                disabled={!travelQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Travel Posts (preview - showing latest 20)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total posts in range: {travelQuery.data?.length ?? 0}
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Departure</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(travelQuery.data ?? []).slice(0, 20).map((r) => (
                      <TableRow key={r.travel_post_id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(r.created_at), "PPp")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{r.driver_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{r.driver_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{r.from_location}</TableCell>
                        <TableCell className="max-w-[220px] truncate">{r.to_location}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(r.departure_date), "PP")}
                          <br />
                          <span className="text-xs text-muted-foreground">{r.departure_time}</span>
                        </TableCell>
                        <TableCell>
                          {r.available_seats}/{r.total_seats}
                        </TableCell>
                        <TableCell>
                          {r.price_cents ? `₹${(r.price_cents / 100).toFixed(0)}` : 'Free'}
                        </TableCell>
                        <TableCell className="capitalize">{String(r.status).replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadCsv(`carpool_requests_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, carpoolReqQuery.data ?? [])}
                disabled={!carpoolReqQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download Carpool Requests CSV
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="errands" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => downloadCsv(`errands_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, errandsQuery.data ?? [])}
                disabled={!errandsQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download CSV
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Errands (preview - showing latest 20)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Total errands in range: {errandsQuery.data?.length ?? 0}
                </p>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(errandsQuery.data ?? []).slice(0, 20).map((r) => (
                      <TableRow key={r.errand_id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(r.created_at), "PPp")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{r.requester_name || "—"}</span>
                            <span className="text-xs text-muted-foreground">{r.requester_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate">{r.title}</TableCell>
                        <TableCell>
                          {r.price_cents ? `₹${(r.price_cents / 100).toFixed(0)}` : 'Free'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {format(new Date(r.expires_at), "PPp")}
                        </TableCell>
                        <TableCell className="capitalize">{String(r.status).replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadCsv(`errand_requests_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, errandReqQuery.data ?? [])}
                disabled={!errandReqQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download Errand Requests CSV
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chats" className="space-y-4">
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => downloadCsv(`help_ticket_chat_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, helpChatQuery.data ?? [])}
                disabled={!helpChatQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download Help Chat CSV
              </Button>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-base">Help ticket chat (preview)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Created</TableHead>
                      <TableHead>Ticket</TableHead>
                      <TableHead>Sender</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(helpChatQuery.data ?? []).slice(0, 20).map((r) => (
                      <TableRow key={r.message_id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(r.created_at), "PPp")}</TableCell>
                        <TableCell className="font-mono text-xs">{String(r.ticket_id).slice(0, 8)}…</TableCell>
                        <TableCell>{r.sender_name || r.sender_email || "—"}</TableCell>
                        <TableCell className="max-w-[520px] truncate">{r.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadCsv(`carpool_requests_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, carpoolReqQuery.data ?? [])}
                disabled={!carpoolReqQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download Carpool Chats CSV
              </Button>
              <div className="w-2" />
              <Button
                type="button"
                variant="outline"
                onClick={() => downloadCsv(`errand_requests_${campusLabel?.name ?? "campus"}_${filenameRange}.csv`, errandReqQuery.data ?? [])}
                disabled={!errandReqQuery.data}
              >
                <Download className="h-4 w-4 mr-2" /> Download Errand Chats CSV
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
