import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RequestMessageDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel?: string;
  maxLength?: number;
  defaultValue?: string;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (message: string) => Promise<void> | void;
};

export default function RequestMessageDialog({
  open,
  title,
  description,
  submitLabel = "Send request",
  maxLength = 140,
  defaultValue = "",
  loading = false,
  onOpenChange,
  onSubmit,
}: RequestMessageDialogProps) {
  const [message, setMessage] = useState(defaultValue);
  const trimmed = useMemo(() => message.trim(), [message]);
  const canSubmit = trimmed.length > 0 && trimmed.length <= maxLength && !loading;

  useEffect(() => {
    if (open) setMessage(defaultValue);
  }, [open, defaultValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="request-message">Message</Label>
          <Input
            id="request-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={maxLength}
            placeholder="One line message…"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Keep it short and clear.</p>
            <p className="text-xs text-muted-foreground">
              {trimmed.length}/{maxLength}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="gradient-primary text-primary-foreground"
            disabled={!canSubmit}
            onClick={() => onSubmit(trimmed)}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
