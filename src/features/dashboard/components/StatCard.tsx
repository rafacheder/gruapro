import { Card } from "@/components/ui/card";
import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: StatCardProps) {
  return (
    <Card
      className={`p-4 md:p-5 border-border ${
        accent ? "bg-gradient-accent text-accent-foreground border-transparent shadow-accent" : "bg-card shadow-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`text-xs font-medium uppercase tracking-wide ${accent ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
          {title}
        </div>
        <Icon className={`h-4 w-4 ${accent ? "text-accent-foreground/80" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-xl md:text-2xl font-bold ${accent ? "text-accent-foreground" : "text-foreground"}`}>
        {value}
      </div>
    </Card>
  );
}
