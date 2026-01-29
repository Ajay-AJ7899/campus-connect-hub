import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "primary" | "warning" | "destructive";

const toneClass: Record<BadgeTone, string> = {
  primary: "gradient-primary text-primary-foreground",
  warning: "bg-warning text-warning-foreground",
  destructive: "bg-destructive text-destructive-foreground",
};

type FeatureHubHeaderProps = {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeTone?: BadgeTone;
  badgeClassName?: string;
};

export default function FeatureHubHeader({
  title,
  subtitle,
  icon: Icon,
  badgeTone = "primary",
  badgeClassName,
}: FeatureHubHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shadow-card",
            toneClass[badgeTone],
            badgeClassName,
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
