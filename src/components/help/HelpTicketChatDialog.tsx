import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { MessageSquare, Send, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

type HelpTicketMessageRow = {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
};

async function fetchMessages(ticketId: string) {
  const { data, error } = await supabase
    .from("help_ticket_messages" as any)
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as unknown as HelpTicketMessageRow[];
}

export function HelpTicketChatDialog({ ticketId, triggerLabel = "Chat" }: { ticketId: string; triggerLabel?: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["help_ticket_messages", ticketId],
    enabled: open,
    queryFn: () => fetchMessages(ticketId),
  });

  const messages = data ?? [];
  const canSend = Boolean(user?.id);

  const header = useMemo(() => {
    return `Ticket chat`;
  }, []);

  const send = async () => {
    if (!user?.id) return;
    const msg = draft.trim();
    if (!msg) return;

    setSending(true);
    try {
      const { error } = await supabase.from("help_ticket_messages" as any).insert({
        ticket_id: ticketId,
        sender_user_id: user.id,
        message: msg,
      });
      if (error) throw error;
      setDraft("");
      await refetch();
    } catch (e: any) {
      toast({
        title: "Couldn’t send",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{header}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <ScrollArea className="h-[320px] rounded-md border p-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m) => {
                  const mine = m.sender_user_id === user?.id;
                  const when = formatDistanceToNowStrict(new Date(m.created_at), { addSuffix: true });
                  return (
                    <div key={m.id} className={mine ? "text-right" : "text-left"}>
                      <div className={mine ? "inline-block max-w-[85%] rounded-lg bg-primary/10 px-3 py-2" : "inline-block max-w-[85%] rounded-lg bg-muted px-3 py-2"}>
                        <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{when}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <div className="grid gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={canSend ? "Write a message…" : "Sign in to send messages."}
              disabled={!canSend || sending}
              className="min-h-[84px]"
            />
            <div className="flex justify-end">
              <Button type="button" onClick={send} disabled={!canSend || sending || !draft.trim()}>
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
