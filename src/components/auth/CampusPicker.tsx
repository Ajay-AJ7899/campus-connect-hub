import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, GraduationCap, Loader2, Plus } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCampuses } from "@/hooks/useCampuses";
import { supabase } from "@/integrations/supabase/client";

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

type CampusOption = { id: string; label: string };

const RECENT_CAMPUSES_KEY = "campus_one:recent_campuses";

const newCampusSchema = z.object({
  name: z.string().trim().min(2, "College name is too short").max(200, "College name is too long"),
  city: z.string().trim().min(2, "City is too short").max(120, "City is too long"),
  state: z.string().trim().max(120, "State is too long").optional().or(z.literal("")),
});

function readRecentCampuses(): CampusOption[] {
  try {
    const raw = localStorage.getItem(RECENT_CAMPUSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // basic runtime validation
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.label === "string")
      .slice(0, 3);
  } catch {
    return [];
  }
}

function writeRecentCampuses(next: CampusOption[]) {
  try {
    localStorage.setItem(RECENT_CAMPUSES_KEY, JSON.stringify(next.slice(0, 3)));
  } catch {
    // ignore storage failures
  }
}

function pushRecentCampus(opt: CampusOption) {
  const existing = readRecentCampuses();
  const deduped = [opt, ...existing.filter((x) => x.id !== opt.id)].slice(0, 3);
  writeRecentCampuses(deduped);
}

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

  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<CampusOption[]>(() => readRecentCampuses());

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", city: "", state: "" });
  const [addError, setAddError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");

  // Keep recent in sync across rerenders (and after selecting)
  useEffect(() => {
    setRecent(readRecentCampuses());
  }, [value]);

  const options: CampusOption[] = useMemo(() => {
    return campuses.map((c) => {
      const place = [c.city, c.state].filter(Boolean).join(", ");
      return {
        id: c.id,
        label: place ? `${c.name} — ${place}` : c.name,
      };
    });
  }, [campuses]);

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    return options.find((o) => o.id === value)?.label ?? recent.find((r) => r.id === value)?.label ?? "";
  }, [value, options, recent]);

  // If we have a prefilled value that doesn't exist anymore, clear it.
  useEffect(() => {
    if (!value) return;
    if (loading) return;
    // NOTE:
    // After creating a campus via rpc("create_campus"), `useCampuses()` won't
    // refetch immediately, so the new campus id won't be in `campuses` yet.
    // We persist newly created campuses into `recent` first, so treat those as
    // valid selections and don't clear them.
    const existsInCampuses = campuses.some((c) => c.id === value);
    const existsInRecent = recent.some((r) => r.id === value);
    if (!existsInCampuses && !existsInRecent) onChange("");
  }, [value, loading, campuses, recent, onChange]);

  const openAddDialogForSearch = () => {
    setAddError(null);
    setAddForm((prev) => ({ ...prev, name: searchValue.trim() }));
    setAddOpen(true);
  };

  const createCampus = async () => {
    setAddError(null);
    const parsed = newCampusSchema.safeParse(addForm);
    if (!parsed.success) {
      setAddError(parsed.error.errors[0]?.message ?? "Please check the fields");
      return;
    }

    setAdding(true);
    try {
      const { data, error: rpcError } = await supabase.rpc("create_campus", {
        _name: parsed.data.name,
        _city: parsed.data.city,
        _state: parsed.data.state || null,
        _country: "USA",
      });

      if (rpcError) throw rpcError;
      const newId = data as unknown as string;
      const place = [parsed.data.city, parsed.data.state].filter(Boolean).join(", ");
      const opt: CampusOption = { id: newId, label: place ? `${parsed.data.name} — ${place}` : parsed.data.name };
      pushRecentCampus(opt);
      setRecent(readRecentCampuses());
      onChange(newId);
      setAddOpen(false);
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not add campus";
      setAddError(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-foreground font-medium">
        {label}
        {required ? " *" : null}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={!!error}
            disabled={disabled || loading}
            className={cn(
              "h-14 w-full justify-between rounded-xl border-2 bg-secondary/50 px-4 text-base font-normal",
              "hover:bg-secondary/50",
              error ? "border-destructive" : "border-border",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <GraduationCap className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className={cn("truncate", !value && "text-muted-foreground")}>
                {loading ? "Loading campuses…" : value ? selectedLabel : "Type your college name"}
              </span>
            </span>
            {loading ? (
              <Loader2 className="h-5 w-5 shrink-0 text-muted-foreground animate-spin" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter>
            <CommandInput
              placeholder="Search college…"
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="space-y-3 px-2 py-2 text-sm">
                  <p className="text-muted-foreground">No matches.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={openAddDialogForSearch}
                    disabled={!searchValue.trim()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add “{searchValue.trim() || "new college"}”
                  </Button>
                </div>
              </CommandEmpty>

              {recent.length > 0 ? (
                <CommandGroup heading="Recent">
                  {recent.map((opt) => (
                    <CommandItem
                      key={opt.id}
                      value={opt.label}
                      onSelect={() => {
                        onChange(opt.id);
                        pushRecentCampus(opt);
                        setRecent(readRecentCampuses());
                        setOpen(false);
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === opt.id ? "opacity-100" : "opacity-0")} />
                      <span className="truncate">{opt.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              <CommandGroup heading="All colleges">
                {options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      onChange(opt.id);
                      pushRecentCampus(opt);
                      setRecent(readRecentCampuses());
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === opt.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={openAddDialogForSearch}
                  disabled={!searchValue.trim()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add a new college
                </Button>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add your college</DialogTitle>
            <DialogDescription>
              Enter the official name and city. We’ll add it and you can select it right away.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-campus-name">College name</Label>
              <Input
                id="new-campus-name"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., University of Example"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-campus-city">City</Label>
              <Input
                id="new-campus-city"
                value={addForm.city}
                onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))}
                placeholder="e.g., Boston"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-campus-state">State (optional)</Label>
              <Input
                id="new-campus-state"
                value={addForm.state}
                onChange={(e) => setAddForm((p) => ({ ...p, state: e.target.value }))}
                placeholder="e.g., MA"
              />
            </div>

            {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button type="button" onClick={createCampus} disabled={adding}>
              {adding ? "Adding…" : "Add college"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
