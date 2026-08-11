import { Link, useRouterState } from "@tanstack/react-router";
import { Map as MapIcon, Plus, BookMarked, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/memories", label: "Memories", icon: BookMarked },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] flex justify-center md:justify-start"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
    >
      <div className="pointer-events-auto mx-4 flex items-center gap-1 border border-border bg-surface/92 px-2 py-1.5 shadow-float backdrop-blur-[3px] md:mx-6">
        <NavItem {...items[0]} active={pathname === "/map"} />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <Link
          to="/leave"
          aria-label="Leave something here"
          className="mx-0.5 grid h-9 w-9 place-items-center bg-foreground text-primary-foreground transition-colors hover:bg-foreground/85"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </Link>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden />
        <NavItem {...items[1]} active={pathname.startsWith("/memories")} />
        <NavItem {...items[2]} active={pathname.startsWith("/profile")} />
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof MapIcon;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-xs tracking-[0.06em] transition-colors",
        active ? "text-foreground" : "text-subtle hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
