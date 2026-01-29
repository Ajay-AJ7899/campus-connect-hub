import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type NotificationRow = {
  id: string;
  created_at: string;
  is_read: boolean;
  message: string;
  title: string;
  type: string;
  related_post_id: string | null;
  related_ticket_id: string | null;
  user_id: string;
};

async function fetchNotifications(profileId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const profileId = profile?.id;

  const query = useQuery({
    enabled: !!profileId,
    queryKey: ["notifications", profileId],
    queryFn: () => fetchNotifications(profileId!),
  });

  const unreadCount = useMemo(() => {
    const rows = query.data ?? [];
    return rows.reduce((acc, n) => acc + (n.is_read ? 0 : 1), 0);
  }, [query.data]);

  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`notifications:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profileId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", profileId] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, queryClient]);

  const markRead = async (notificationId: string) => {
    if (!profileId) return;
    await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);
  };

  return {
    ...query,
    notifications: query.data ?? [],
    unreadCount,
    markRead,
  };
}
