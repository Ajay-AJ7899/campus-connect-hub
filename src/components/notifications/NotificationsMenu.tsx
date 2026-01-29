import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

function getNotificationTarget(type: string) {
  if (type === "carpool_request") return "/carpooling?tab=trips";
  if (type === "errand_request") return "/errands?tab=my-requests";
  if (type === "help_ticket") return "/help?tab=active";
  return "/home";
}

export default function NotificationsMenu() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, markRead } = useNotifications();

  const top = useMemo(() => notifications.slice(0, 10), [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-accent text-accent-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 bg-background">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <Link to="/home" className="text-xs text-muted-foreground hover:underline">
            View all
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">Loading…</div>
        ) : top.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          top.map((n) => {
            const ts = formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true });
            return (
              <DropdownMenuItem
                key={n.id}
                className={cn("flex flex-col items-start gap-1 cursor-pointer", !n.is_read && "bg-muted/40")}
                onClick={async () => {
                  if (!n.is_read) await markRead(n.id);
                  navigate(getNotificationTarget(n.type));
                }}
              >
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="font-medium text-sm line-clamp-1">{n.title}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{ts}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
