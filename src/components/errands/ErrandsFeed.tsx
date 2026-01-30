import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import { Image as ImageIcon, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequestMessageDialog from "@/components/common/RequestMessageDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import type { ErrandPhotoRow, ErrandRow } from "./errands.types";
import { formatMoneyFromCents } from "@/lib/money";
 import PostChatDialog from "@/components/common/PostChatDialog";

type ErrandsFeedProps = {
  mode: "feed" | "mine";
  requesterProfileId?: string | null;
};

type ErrandWithPhotos = ErrandRow & { photos: ErrandPhotoRow[] };
type ErrandWithPhotosAndPrice = ErrandWithPhotos & { price_cents?: number | null };

async function fetchErrands(mode: ErrandsFeedProps["mode"], requesterProfileId?: string | null) {
  const nowIso = new Date().toISOString();

  let q = supabase
    // Supabase types are generated; new tables may not be in types yet.
    .from("errands" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (mode === "feed") {
    q = q.eq("status", "active").gt("expires_at", nowIso);
  }

  if (mode === "mine" && requesterProfileId) {
    q = q.eq("requester_profile_id", requesterProfileId);
  }

  const { data, error } = await q;
  if (error) throw error;
  const errands = (data ?? []) as unknown as ErrandRow[];

  if (errands.length === 0) return [] as ErrandWithPhotos[];

  const { data: photosData, error: photosError } = await supabase
    .from("errand_photos" as any)
    .select("*")
    .in(
      "errand_id",
      errands.map((e) => e.id),
    )
    .order("sort_order", { ascending: true });

  if (photosError) throw photosError;
  const photos = (photosData ?? []) as unknown as ErrandPhotoRow[];

  const byErrand = new Map<string, ErrandPhotoRow[]>();
  for (const p of photos) {
    byErrand.set(p.errand_id, [...(byErrand.get(p.errand_id) ?? []), p]);
  }

  return errands.map((e) => ({ ...e, photos: byErrand.get(e.id) ?? [] }));
}

async function signUrl(path: string) {
  const { data, error } = await supabase.storage.from("errand-photos").createSignedUrl(path, 60 * 30);
  if (error) throw error;
  return data.signedUrl;
}

export default function ErrandsFeed({ mode, requesterProfileId }: ErrandsFeedProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requestErrandId, setRequestErrandId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["errands", mode, requesterProfileId],
    queryFn: () => fetchErrands(mode, requesterProfileId),
  });

  const errands = data ?? [];

  const photoPaths = useMemo(() => {
    const set = new Set<string>();
    for (const e of errands) for (const p of e.photos) set.add(p.path);
    return [...set];
  }, [errands]);

  const { data: signedUrlMap } = useQuery({
    queryKey: ["errands_photo_urls", photoPaths],
    enabled: photoPaths.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(photoPaths.map(async (p) => [p, await signUrl(p)] as const));
      return Object.fromEntries(entries) as Record<string, string>;
    },
  });

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
        <p className="text-sm text-muted-foreground">Couldn’t load errands.</p>
        <button className="text-sm underline mt-2" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (errands.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No errands yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          {mode === "mine" ? "You haven’t posted any errands." : "Be the first to post an errand for your campus."}
        </p>
      </div>
    );
  }

  const now = new Date();

  const submitRequest = async (message: string) => {
    if (!profile || !requestErrandId) return;

    const errand = errands.find((e) => e.id === requestErrandId);
    if (!errand) return;

    if (errand.requester_profile_id === profile.id) {
      toast({
        variant: "destructive",
        title: "Not allowed",
        description: "You can’t request your own errand.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from("contact_requests").insert({
        entity_type: "errand",
        entity_id: errand.id,
        owner_profile_id: errand.requester_profile_id,
        requester_profile_id: profile.id,
        message,
      });

      if (insertError) {
        if (insertError.code === "23505") {
          toast({
            title: "Already requested",
            description: "You already sent a request for this errand.",
          });
          setRequestErrandId(null);
          return;
        }
        throw insertError;
      }

      toast({
        title: "Request sent",
        description: "Your message was sent to the errand owner.",
      });
      setRequestErrandId(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn’t send request",
        description: "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <RequestMessageDialog
        open={requestErrandId !== null}
        onOpenChange={(open) => {
          if (!open) setRequestErrandId(null);
        }}
        title="Request to help"
        description="Send a quick one-line message to the person who posted this errand."
        submitLabel="Send request"
        loading={submitting}
        onSubmit={submitRequest}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {(errands as ErrandWithPhotosAndPrice[]).map((e) => {
        const isExpired = new Date(e.expires_at) <= now || e.status !== "active";
        const createdLabel = formatDistanceToNowStrict(new Date(e.created_at), { addSuffix: true });

        const photoUrls = (e.photos ?? [])
          .slice(0, 2)
          .map((p) => signedUrlMap?.[p.path])
          .filter(Boolean) as string[];

        return (
          <Card key={e.id} className="overflow-hidden">
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted">
                {photoUrls.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${e.title} photo ${idx + 1}`}
                    className="h-28 w-full object-cover rounded-md"
                    loading="lazy"
                  />
                ))}
              </div>
            )}

            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-tight truncate">{e.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">Posted {createdLabel}</p>
                </div>
                {mode === "mine" && (
                  <Badge variant={isExpired ? "secondary" : "default"}>{isExpired ? "Expired" : "Active"}</Badge>
                )}
              </div>

              {typeof e.price_cents === "number" && (
                <div className="mt-3">
                  <Badge variant="secondary">
                    {e.price_cents === 0 ? "Free" : formatMoneyFromCents(e.price_cents)}
                  </Badge>
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-3 line-clamp-4">{e.description}</p>

              {mode === "feed" && (
                <div className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Expires in {formatDistanceToNowStrict(new Date(e.expires_at))}
                  </p>

                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => navigate(`/users/${e.requester_profile_id}`)}
                  >
                    View profile
                  </Button>

                  <PostChatDialog entityType="errand" entityId={e.id} />

                  <Button
                    className="w-full gradient-primary text-primary-foreground"
                    disabled={!profile || profile.id === e.requester_profile_id}
                    onClick={() => setRequestErrandId(e.id)}
                  >
                    Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      </div>
    </>
  );
}
