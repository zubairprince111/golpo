import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "grid h-9 w-9 place-items-center border border-border bg-surface/90 text-foreground/70 backdrop-blur-[2px] transition-colors hover:bg-surface hover:text-foreground disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  className,
  variant = "solid",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "outline" | "ghost" }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 px-5 py-2.5 text-[0.8125rem] tracking-[0.04em] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "solid" && "bg-foreground text-primary-foreground hover:bg-foreground/85",
        variant === "outline" &&
          "border border-foreground/25 text-foreground hover:border-foreground/60",
        variant === "ghost" && "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("label-xs", className)}>{children}</p>;
}
