"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null
  alt?: string
  fallback?: string
  size?: "sm" | "default" | "lg"
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
}

function Avatar({ src, alt, fallback, size = "default", className, ...props }: AvatarProps) {
  const [hasError, setHasError] = React.useState(false)

  const initials = React.useMemo(() => {
    if (fallback) return fallback.slice(0, 2).toUpperCase()
    if (alt) {
      return alt
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    }
    return "?"
  }, [fallback, alt])

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-primary/20 text-accent-primary font-medium",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt ?? ""}
          className="aspect-square h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

export { Avatar }
