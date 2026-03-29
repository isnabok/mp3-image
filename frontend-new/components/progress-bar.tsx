"use client"

import { cn } from "@/lib/utils"

interface ProgressBarProps {
  progress: number
  label: string
  variant?: "upload" | "download"
}

export function ProgressBar({ progress, label, variant = "upload" }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          variant === "upload" ? "text-primary" : "text-chart-3"
        )}>
          {progress}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full relative overflow-hidden",
            variant === "upload"
              ? "bg-gradient-to-r from-primary via-primary to-accent"
              : "bg-gradient-to-r from-chart-3 via-chart-4 to-chart-3"
          )}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  )
}
