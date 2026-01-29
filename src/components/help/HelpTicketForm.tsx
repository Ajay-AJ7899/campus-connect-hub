import { useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, MapPin } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  category: z.enum(["medical", "safety", "mental_health", "lost_item", "other"]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(10, "Please add a bit more detail."),
  shareLocation: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

async function tryGetLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!("geolocation" in navigator)) return null;

  return await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  });
}

export default function HelpTicketForm({ onCreated }: { onCreated?: () => void }) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "safety",
      urgency: "high",
      description: "",
      shareLocation: true,
    },
  });

  const canSubmit = useMemo(() => {
    return Boolean(user && profile?.campus_id);
  }, [user, profile?.campus_id]);

  const onSubmit = async (values: FormValues) => {
    if (!user || !profile?.campus_id) {
      toast({
        title: "Can’t submit",
        description: "Please sign in and select a campus first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create ticket first
      const { data: ticket, error: ticketError } = await supabase
        .from("help_tickets")
        .insert({
          requester_user_id: user.id,
          campus_id: profile.campus_id,
          category: values.category,
          urgency: values.urgency,
          description: values.description.trim(),
        } as any)
        .select("*")
        .single();

      if (ticketError) throw ticketError;

      // Optional location attachment (expires in 1 hour)
      if (values.shareLocation) {
        const loc = await tryGetLocation();
        if (loc) {
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          const { error: locError } = await supabase.from("help_ticket_locations").insert({
            ticket_id: ticket.id,
            lat: loc.lat,
            lng: loc.lng,
            expires_at: expiresAt,
          } as any);

          if (locError) {
            // Ticket is created—location is best-effort.
            toast({
              title: "Ticket submitted",
              description: "Location couldn’t be attached (permission denied or unavailable).",
            });
          }
        } else {
          toast({
            title: "Ticket submitted",
            description: "Location couldn’t be captured (permission denied or unavailable).",
          });
        }
      }

      toast({ title: "Help request submitted", description: "Admins at your campus were notified." });
      form.reset();
      onCreated?.();
    } catch (e: any) {
      toast({
        title: "Couldn’t submit request",
        description: e?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Report urgent help
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!canSubmit && (
          <p className="text-sm text-muted-foreground mb-4">Please sign in and select a campus to submit a request.</p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="safety">Safety</SelectItem>
                        <SelectItem value="mental_health">Mental health</SelectItem>
                        <SelectItem value="lost_item">Lost item</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What’s happening?</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Include location details, what you need, and any safety/medical context."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shareLocation"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-start gap-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Share live location
                      </FormLabel>
                      <FormDescription>
                        Your coordinates are shared privately with admins and auto-expire after 1 hour.
                      </FormDescription>
                    </div>
                  </div>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit request"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
