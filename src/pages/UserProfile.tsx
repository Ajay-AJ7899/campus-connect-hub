import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useCampuses } from "@/hooks/useCampuses";

type PublicProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  trips_completed: number;
  campus_id: string | null;
};

export default function UserProfile() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const { campuses } = useCampuses();
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<PublicProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!profileId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, is_verified, trips_completed, campus_id")
        .eq("id", profileId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setRow(null);
      } else {
        setRow((data as PublicProfile) ?? null);
      }
      setLoading(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  const campusName = useMemo(() => {
    if (!row?.campus_id) return null;
    return campuses.find((c) => c.id === row.campus_id)?.name ?? null;
  }, [campuses, row?.campus_id]);

  const initials = (row?.full_name ?? "User")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0]!)
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <button className="text-sm text-muted-foreground hover:underline" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">User Profile</h1>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !row ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">User not found.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={row.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold truncate">{row.full_name || "User"}</h2>
                    <Badge variant={row.is_verified ? "default" : "secondary"}>
                      {row.is_verified ? "Verified" : "Not verified"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Trips completed: {row.trips_completed ?? 0}</p>
                  {campusName && <p className="text-sm text-muted-foreground">Campus: {campusName}</p>}
                </div>
              </div>

              {row.bio && <p className="text-sm mt-4 whitespace-pre-wrap">{row.bio}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
