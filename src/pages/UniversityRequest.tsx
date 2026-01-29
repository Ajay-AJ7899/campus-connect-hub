import { useMemo, useState } from "react";
import { z } from "zod";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().min(2).max(80),
});

const UniversityRequest = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", city: "", state: "", country: "USA" });

  const errors = useMemo(() => {
    const result = schema.safeParse(form);
    if (result.success) return {} as Record<string, string>;
    const out: Record<string, string> = {};
    for (const e of result.error.errors) out[e.path.join(".")] = e.message;
    return out;
  }, [form]);

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ variant: "destructive", title: "Check your details", description: "Please fix the form errors." });
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const payload = {
        requester_user_id: user.id,
        name: parsed.data.name,
        city: parsed.data.city,
        state: parsed.data.state || null,
        country: parsed.data.country,
        status: "pending",
      };

      const { error } = await (supabase as any).from("campus_requests").insert(payload);
      if (error) {
        toast({ variant: "destructive", title: "Request failed", description: error.message });
        return;
      }

      toast({ title: "Request submitted", description: "A Super Admin will review it shortly." });
      setForm({ name: "", city: "", state: "", country: "USA" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Request your University</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">University name</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State (optional)</Label>
                  <Input id="state" value={form.state} onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))} />
                  {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
                {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
              </div>

              <Button className="w-full" onClick={submit} disabled={loading}>
                {loading ? "Submitting…" : "Submit request"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UniversityRequest;
