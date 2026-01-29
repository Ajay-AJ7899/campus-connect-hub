import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminInvite = () => {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const redeem = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Enter a code" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc("redeem_admin_invite", {
        _code: trimmed,
      });

      if (error) {
        toast({ variant: "destructive", title: "Invite failed", description: error.message });
        return;
      }

      if (!data?.ok) {
        toast({ variant: "destructive", title: "Invite failed", description: data?.error ?? "Invalid code" });
        return;
      }

      toast({ title: "You're now an admin", description: "Admin access enabled for your university." });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Redeem Admin Invite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite">Invite code</Label>
                <Input
                  id="invite"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your invite code"
                  autoComplete="off"
                />
              </div>
              <Button className="w-full" onClick={redeem} disabled={loading}>
                {loading ? "Redeeming…" : "Redeem"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default AdminInvite;
