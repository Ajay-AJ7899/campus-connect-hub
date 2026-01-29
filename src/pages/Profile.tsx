import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useCampuses } from "@/hooks/useCampuses";

export default function Profile() {
  const { user, profile } = useAuth();
  const { campuses } = useCampuses();

  const campusName = campuses.find((c) => c.id === profile?.campus_id)?.name;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground mt-2">Your account details (campus is locked after signup).</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-semibold">{profile?.full_name || "—"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-semibold">{user?.email || "—"}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Verification</p>
                <div className="mt-1">
                  <Badge variant={profile?.is_verified ? "default" : "secondary"}>
                    {profile?.is_verified ? "Verified" : "Not verified"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Campus</p>
                <p className="font-semibold">{campusName || (profile?.campus_id ? "Unknown campus" : "—")}</p>
                <p className="text-xs text-muted-foreground mt-1">Campus can’t be changed from the app.</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Trips completed</p>
                <p className="font-semibold">{profile?.trips_completed ?? 0}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="text-sm">{profile?.bio || "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
