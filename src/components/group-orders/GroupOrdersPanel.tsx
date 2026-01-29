import * as React from "react";
import { useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Plus, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import type { GroupOrderParticipantRow, GroupOrderRow } from "./groupOrders.types";

type OrderWithMeta = GroupOrderRow & {
  participantsCount: number;
  myParticipation?: GroupOrderParticipantRow | null;
};

async function fetchGroupOrders(campusId: string, myProfileId: string) {
  const { data: ordersData, error: ordersError } = await supabase
    .from("group_orders")
    .select("*")
    .eq("campus_id", campusId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(50);

  if (ordersError) throw ordersError;

  const orders = (ordersData ?? []) as GroupOrderRow[];
  if (orders.length === 0) return [] as OrderWithMeta[];

  const { data: partsData, error: partsError } = await supabase
    .from("group_order_participants")
    .select("*")
    .in(
      "order_id",
      orders.map((o) => o.id),
    );

  if (partsError) throw partsError;
  const participants = (partsData ?? []) as GroupOrderParticipantRow[];

  const byOrder = new Map<string, GroupOrderParticipantRow[]>();
  for (const p of participants) {
    byOrder.set(p.order_id, [...(byOrder.get(p.order_id) ?? []), p]);
  }

  return orders.map((o) => {
    const list = byOrder.get(o.id) ?? [];
    const mine = list.find((p) => p.participant_profile_id === myProfileId) ?? null;
    return {
      ...o,
      participantsCount: list.length,
      myParticipation: mine,
    } satisfies OrderWithMeta;
  });
}

const GroupOrdersPanel = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineAt, setDeadlineAt] = useState<string>("");

  const campusId = profile?.campus_id ?? null;
  const myProfileId = profile?.id ?? null;

  const {
    data: orders,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["group_orders", campusId, myProfileId],
    enabled: Boolean(campusId && myProfileId),
    queryFn: () => fetchGroupOrders(campusId as string, myProfileId as string),
  });

  const canUse = Boolean(campusId && myProfileId);

  const createDisabled = useMemo(() => {
    return !title.trim() || !description.trim() || !canUse;
  }, [title, description, canUse]);

  const onCreate = async () => {
    if (!campusId || !myProfileId) return;
    try {
      const payload = {
        campus_id: campusId,
        creator_profile_id: myProfileId,
        title: title.trim(),
        description: description.trim(),
        deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
        status: "active",
      };

      const { error: insertError } = await supabase.from("group_orders").insert(payload as any);
      if (insertError) throw insertError;

      toast({ title: "Group order created" });
      setOpen(false);
      setTitle("");
      setDescription("");
      setDeadlineAt("");
      await refetch();
    } catch (e: any) {
      toast({
        title: "Couldn’t create order",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onJoinOrUpdate = async (orderId: string, quantity: number, note: string) => {
    if (!myProfileId) return;
    try {
      // If user already joined, update; else insert
      const existing = (orders ?? []).find((o) => o.id === orderId)?.myParticipation;

      if (existing) {
        const { error: updateError } = await supabase
          .from("group_order_participants")
          .update({ quantity, note: note.trim() ? note.trim() : null } as any)
          .eq("id", existing.id);
        if (updateError) throw updateError;
        toast({ title: "Participation updated" });
      } else {
        const { error: insertError } = await supabase.from("group_order_participants").insert({
          order_id: orderId,
          participant_profile_id: myProfileId,
          quantity,
          note: note.trim() ? note.trim() : null,
        } as any);
        if (insertError) throw insertError;
        toast({ title: "Joined order" });
      }

      await refetch();
    } catch (e: any) {
      toast({
        title: "Couldn’t update participation",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  const onLeave = async (participantId: string) => {
    try {
      const { error: delError } = await supabase.from("group_order_participants").delete().eq("id", participantId);
      if (delError) throw delError;
      toast({ title: "Left order" });
      await refetch();
    } catch (e: any) {
      toast({
        title: "Couldn’t leave order",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!canUse) {
    return (
      <div ref={ref} className="text-sm text-muted-foreground">
        To use Group Orders, please make sure you’re signed in and have selected a campus.
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Group Orders</h2>
          <p className="text-sm text-muted-foreground">Create an order and let others join with quantity + notes.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a group order</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Chipotle run" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Where are you ordering from, what’s the plan, pickup time, etc."
                />
              </div>
              <div className="space-y-2">
                <Label>Deadline (optional)</Label>
                <Input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} />
                <p className="text-xs text-muted-foreground">If set, others should join before this time.</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={onCreate} disabled={createDisabled}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading group orders…</div>}

      {error && (
        <div className="text-sm">
          <p className="text-muted-foreground">Couldn’t load group orders.</p>
          <button className="underline text-sm mt-1" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && (orders?.length ?? 0) === 0 && (
        <div className="text-center py-14">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No active group orders</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Create one to kick things off for your campus.</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(orders ?? []).map((o) => (
          <GroupOrderCard key={o.id} order={o} onJoinOrUpdate={onJoinOrUpdate} onLeave={onLeave} />
        ))}
      </div>
    </div>
  );
});

GroupOrdersPanel.displayName = "GroupOrdersPanel";

export default GroupOrdersPanel;

function GroupOrderCard({
  order,
  onJoinOrUpdate,
  onLeave,
}: {
  order: OrderWithMeta;
  onJoinOrUpdate: (orderId: string, quantity: number, note: string) => Promise<void>;
  onLeave: (participantId: string) => Promise<void>;
}) {
  const [joinOpen, setJoinOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(order.myParticipation?.quantity ?? 1);
  const [note, setNote] = useState<string>(order.myParticipation?.note ?? "");

  const deadlineLabel = order.deadline_at
    ? `Join by ${formatDistanceToNowStrict(new Date(order.deadline_at), { addSuffix: true })}`
    : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg truncate">{order.title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {order.participantsCount} participant{order.participantsCount === 1 ? "" : "s"}
          {deadlineLabel ? ` • ${deadlineLabel}` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-4">{order.description}</p>

        <div className="flex items-center gap-2">
          {order.myParticipation ? (
            <>
              <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="flex-1">
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update participation</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any specifics?" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setJoinOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        await onJoinOrUpdate(order.id, quantity, note);
                        setJoinOpen(false);
                      }}
                    >
                      Save
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onLeave(order.myParticipation!.id)}
              >
                Leave
              </Button>
            </>
          ) : (
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button className="flex-1">Join</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join this order</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Note (optional)</Label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What do you want?" />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="secondary" onClick={() => setJoinOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      await onJoinOrUpdate(order.id, quantity, note);
                      setJoinOpen(false);
                    }}
                  >
                    Join
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
