import * as React from "react";

import { Button } from "@/components/ui/button";

type ComingSoonPlaceholderProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function ComingSoonPlaceholder({ title, description, icon: Icon }: ComingSoonPlaceholderProps) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
      <Button variant="outline" disabled>
        Coming Soon
      </Button>
    </div>
  );
}
