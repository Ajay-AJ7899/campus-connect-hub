import { formatDistanceToNowStrict } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import type { HelpTicketRow } from "./help.types";

async function fetchMyTickets(userId: string) {
  const { data, error } = await supabase
    .from("help_tickets")
    .select("*")
    .eq("requester_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as HelpTicketRow[];
}

function statusTone(status: string): "default" | "secondary" | "destructive" {
  if (status === "resolved") return "secondary";
  return "default";
}

export default function MyHelpTickets() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["help_tickets_mine", user?.id],
    enabled: Boolean(user?.id),
    queryFn: () => fetchMyTickets(user!.id),
  });

  if (!user) {
    return <p className="text-sm text-muted-foreground">Please sign in to view your help requests.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Couldn’t load your requests.</p>
        <button className="text-sm underline mt-2" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  const tickets = data ?? [];
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No requests yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">Submit a request in the Report tab.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((t) => {
        const createdLabel = formatDistanceToNowStrict(new Date(t.created_at), { addSuffix: true });
        const categoryLabel = String(t.category).replace(/_/g, " ");
        const statusLabel = String(t.status).replace(/_/g, " ");
        const urgencyLabel = String(t.urgency).replace(/_/g, " ");
        return (
          <Card key={t.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold capitalize truncate">{categoryLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted {createdLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={statusTone(t.status)} className="capitalize">
                    {statusLabel}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {urgencyLabel}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{t.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
