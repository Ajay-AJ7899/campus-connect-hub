import { useMemo, useState } from "react";
import { z } from "zod";
import { Loader2, Upload, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseMoneyToCents } from "@/lib/money";

const MAX_FILES = 2;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const schema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(80, "Title is too long"),
  description: z.string().trim().min(10, "Description is too short").max(800, "Description is too long"),
  price: z.string().trim().max(20).optional(),
});

type ErrandPostFormProps = {
  onSuccess?: () => void;
};

export default function ErrandPostForm({ onSuccess }: ErrandPostFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);

  const validateFiles = (nextFiles: File[]) => {
    if (nextFiles.length > MAX_FILES) {
      toast({
        variant: "destructive",
        title: "Too many photos",
        description: `You can upload up to ${MAX_FILES} photos per errand.`,
      });
      return false;
    }

    for (const f of nextFiles) {
      if (!f.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Invalid file", description: "Only image files are allowed." });
        return false;
      }
      if (f.size > MAX_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Each photo must be 5MB or less.",
        });
        return false;
      }
    }
    return true;
  };

  const onPickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const next = [...files, ...Array.from(picked)];
    if (!validateFiles(next)) return;
    setFiles(next.slice(0, MAX_FILES));
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setFiles([]);
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast({ variant: "destructive", title: "Profile not ready", description: "Please try again in a moment." });
      return;
    }

    const parsed = schema.safeParse({ title, description, price });
    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Fix the form",
        description: parsed.error.issues[0]?.message ?? "Invalid input.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: errandRow, error: errandError } = await supabase
        .from("errands" as any)
        .insert({
          requester_profile_id: profile.id,
          campus_id: profile.campus_id ?? null,
          title: parsed.data.title,
          description: parsed.data.description,
          price_cents: parseMoneyToCents(parsed.data.price ?? ""),
        })
        .select("*")
        .single();

      if (errandError) throw errandError;
      const errandId = (errandRow as any).id as string;

      // Upload up to 2 photos
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${errandId}/${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage.from("errand-photos").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const { error: photoError } = await supabase.from("errand_photos" as any).insert({
          errand_id: errandId,
          path,
          sort_order: i,
        });
        if (photoError) throw photoError;
      }

      toast({ title: "Errand posted", description: "Your errand is now visible in Browse." });
      reset();
      onSuccess?.();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Couldn’t post errand", description: e?.message ?? "Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Post an Errand</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Need notebook from store" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What do you need, where, and by when?"
            rows={5}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Price / reward (optional)</label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$10"
            inputMode="decimal"
          />
          <p className="text-xs text-muted-foreground">Leave empty if there’s no payment.</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">Photos (optional, max 2)</label>
            <p className="text-xs text-muted-foreground">{files.length}/{MAX_FILES}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => onPickFiles(e.target.files)}
              disabled={files.length >= MAX_FILES}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {previews.map((p, idx) => (
                  <div key={idx} className="relative">
                    <img src={p.url} alt={`Selected photo ${idx + 1}`} className="h-28 w-full object-cover rounded-lg" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 rounded-md bg-background/80 border border-border p-1"
                      onClick={() => removeFile(idx)}
                      aria-label="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={submitting} className="gradient-primary text-primary-foreground">
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Post
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
