import { useEffect, useMemo } from "react";
import { GraduationCap, Loader2 } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCampuses } from "@/hooks/useCampuses";

type Props = {
  id?: string;
  label?: string;
  value: string;
  onChange: (campusId: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
};

export default function CampusPicker({
  id = "campus",
  label = "College / Campus",
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  hint,
}: Props) {
  const { campuses, loading } = useCampuses();

  const options = useMemo(() => {
    return campuses.map((c) => {
      const place = [c.city, c.state].filter(Boolean).join(", ");
      return {
        id: c.id,
        label: place ? `${c.name} — ${place}` : c.name,
      };
    });
  }, [campuses]);

  // If we have a prefilled value that doesn't exist anymore, clear it.
  useEffect(() => {
    if (!value) return;
    if (loading) return;
    const exists = campuses.some((c) => c.id === value);
    if (!exists) onChange("");
  }, [value, loading, campuses, onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium">
        {label}
        {required ? " *" : null}
      </Label>
      <div className="relative">
        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          aria-invalid={!!error}
          className={cn(
            "h-14 w-full appearance-none rounded-xl border-2 bg-secondary/50 pl-12 pr-12 text-base text-foreground transition-all",
            "focus:bg-background focus:border-primary focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-destructive" : "border-border",
          )}
        >
          <option value="">{loading ? "Loading campuses…" : "Select your campus"}</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        ) : null}
      </div>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
