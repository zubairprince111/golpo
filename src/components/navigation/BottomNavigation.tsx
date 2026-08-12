import { Link, useRouterState } from "@tanstack/react-router";
import { Map, Plus, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNavigation({
  onCreate,
}: {
  onCreate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[600] flex justify-center px-4"
    >
      <div className="pointer-events-auto flex items-center gap-6 sm:gap-8 rounded-full amou-glass-pill px-5 py-2 shadow-md">
        {/* 1. Map */}
        <Link
          to="/map"
          title="Public Map"
          aria-label="Public Map"
          className={cn(
            "p-1.5 text-[#48484A] transition-transform hover:scale-110 hover:text-[#1D1D1F]",
            pathname === "/map" && "text-[#1D1D1F] scale-105 font-bold",
          )}
        >
          <Map className="h-5 w-5" strokeWidth={1.75} />
        </Link>

        {/* 2. Leave / Create Memory (+) - Prominent Circular Pop Button */}
        {onCreate ? (
          <button
            type="button"
            onClick={onCreate}
            title="Leave a memory"
            aria-label="Leave a memory"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-md transition-all hover:scale-110 hover:bg-black hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        ) : (
          <Link
            to="/leave"
            title="Leave a memory"
            aria-label="Leave a memory"
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1D1D1F] text-white shadow-md transition-all hover:scale-110 hover:bg-black hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        )}

        {/* 3. Diary (Personal Archive) */}
        <Link
          to="/memories"
          title="Diary"
          aria-label="Diary"
          className={cn(
            "p-1.5 text-[#48484A] transition-transform hover:scale-110 hover:text-[#1D1D1F]",
            pathname.startsWith("/memories") && "text-[#1D1D1F] scale-105",
          )}
        >
          <BookOpen className="h-5 w-5" strokeWidth={1.75} />
        </Link>

        {/* 4. Profile */}
        <Link
          to="/profile"
          title="Profile"
          aria-label="Profile"
          className={cn(
            "p-1.5 text-[#48484A] transition-transform hover:scale-110 hover:text-[#1D1D1F]",
            pathname.startsWith("/profile") && "text-[#1D1D1F] scale-105",
          )}
        >
          <User className="h-5 w-5" strokeWidth={1.75} />
        </Link>
      </div>
    </nav>
  );
}
