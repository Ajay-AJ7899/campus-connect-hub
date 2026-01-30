 import { useEffect, useMemo, useState } from "react";
 import { formatDistanceToNowStrict } from "date-fns";
 import { MessageSquare, Send, Loader2 } from "lucide-react";
 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from "@/components/ui/dialog";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Textarea } from "@/components/ui/textarea";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 
 type PostChatDialogProps = {
   entityType: "carpool" | "errand";
   entityId: string;
   triggerLabel?: string;
 };
 
 type MessageRow = {
   id: string;
   created_at: string;
   message: string;
   sender_profile_id: string;
   sender: { full_name: string | null; avatar_url: string | null };
 };
 
 async function fetchMessages(entityType: string, entityId: string) {
   // NOTE: post_messages.sender_profile_id is not a declared FK to profiles in the backend schema,
   // so we cannot use PostgREST embedded joins here. We fetch messages, then hydrate sender info.
   const { data: msgs, error } = await supabase
     .from("post_messages")
     .select("id, created_at, message, sender_profile_id")
     .eq("entity_type", entityType)
     .eq("entity_id", entityId)
     .order("created_at", { ascending: true });

   if (error) throw error;

   const messageRows = (msgs ?? []) as Array<{
     id: string;
     created_at: string;
     message: string;
     sender_profile_id: string;
   }>;

   const senderIds = Array.from(new Set(messageRows.map((m) => m.sender_profile_id)));
   if (senderIds.length === 0) return [];

   const { data: profiles, error: profilesError } = await supabase
     .from("profiles")
     .select("id, full_name, avatar_url")
     .in("id", senderIds);

   if (profilesError) throw profilesError;

   const byId = new Map(
     (profiles ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]),
   );

   return messageRows.map((m) => ({
     ...m,
     sender: byId.get(m.sender_profile_id) ?? { full_name: null, avatar_url: null },
   })) as MessageRow[];
 }
 
 export default function PostChatDialog({ entityType, entityId, triggerLabel = "Chat" }: PostChatDialogProps) {
   const { profile } = useAuth();
   const { toast } = useToast();
   const [open, setOpen] = useState(false);
   const [draft, setDraft] = useState("");
   const [sending, setSending] = useState(false);
 
   const { data: messages, refetch } = useQuery({
     queryKey: ["post_chat", entityType, entityId],
     enabled: open,
     queryFn: () => fetchMessages(entityType, entityId),
   });
 
   useEffect(() => {
     if (!open) return;
     const channel = supabase
       .channel(`post_chat:${entityType}:${entityId}`)
       .on(
         "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "post_messages",
            filter: `entity_id=eq.${entityId}`,
          },
         () => refetch(),
       )
       .subscribe();
     return () => {
       supabase.removeChannel(channel);
     };
   }, [open, entityType, entityId, refetch]);
 
   const sendMessage = async () => {
     const text = draft.trim();
     if (!text || !profile) return;
 
     setSending(true);
    const { error } = await supabase.from("post_messages").insert([{
       entity_type: entityType,
       entity_id: entityId,
       sender_profile_id: profile.id,
       message: text,
      expires_at: new Date().toISOString(),
    }]);
 
     setSending(false);
     if (error) {
       toast({ variant: "destructive", title: "Couldn't send", description: "Try again." });
     } else {
       setDraft("");
       refetch();
     }
   };
 
   const getInitials = (name: string | null) => {
     if (!name) return "U";
     return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
   };
 
   return (
     <Dialog open={open} onOpenChange={setOpen}>
       <DialogTrigger asChild>
         <Button type="button" size="sm" variant="outline">
           <MessageSquare className="w-4 h-4 mr-2" />
           {triggerLabel}
         </Button>
       </DialogTrigger>
       <DialogContent className="max-w-lg">
         <DialogHeader>
           <DialogTitle>Chat</DialogTitle>
            <DialogDescription>
              Messages are visible while the post is active.
            </DialogDescription>
         </DialogHeader>
 
         <ScrollArea className="h-[400px] pr-4">
           {(messages ?? []).length === 0 ? (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
               <MessageSquare className="w-12 h-12 mb-2" />
               <p className="text-sm">No messages yet. Start the conversation!</p>
             </div>
           ) : (
             <div className="space-y-4">
               {(messages ?? []).map((m) => {
                 const isMe = m.sender_profile_id === profile?.id;
                 return (
                   <div key={m.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                     <Avatar className="w-8 h-8 shrink-0">
                       <AvatarImage src={m.sender.avatar_url || undefined} />
                       <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                         {getInitials(m.sender.full_name)}
                       </AvatarFallback>
                     </Avatar>
                     <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                       <p className={`text-xs text-muted-foreground ${isMe ? "text-right" : ""}`}>
                         {m.sender.full_name || "User"} • {formatDistanceToNowStrict(new Date(m.created_at), { addSuffix: true })}
                       </p>
                       <div
                         className={`mt-1 px-3 py-2 rounded-lg max-w-xs ${
                           isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                         }`}
                       >
                         <p className="text-sm whitespace-pre-wrap break-words">{m.message}</p>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </ScrollArea>
 
         <div className="flex gap-2 mt-4">
           <Textarea
             placeholder="Type a message…"
             value={draft}
             onChange={(e) => setDraft(e.target.value)}
             onKeyDown={(e) => {
               if (e.key === "Enter" && !e.shiftKey) {
                 e.preventDefault();
                 sendMessage();
               }
             }}
             rows={2}
             className="resize-none"
           />
           <Button type="button" onClick={sendMessage} disabled={!draft.trim() || sending} size="icon">
             {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 }