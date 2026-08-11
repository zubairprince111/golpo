import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useMemo } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { excerpt, formatMemoryDate, isBangla } from "@/lib/format";
import { useAppState } from "@/lib/store";
import type { Memory } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/memories")({
  head: () => ({
    meta: [
      { title: "My Memories — A Map of Us" },
      {
        name: "description",
        content: "A personal, chronological archive of the memories you left on the map.",
      },
      { property: "og:title", content: "My Memories — A Map of Us" },
      {
        property: "og:description",
        content: "Your archive, ordered by month and year, each entry still attached to its place.",
      },
    ],
  }),
  component: MemoriesPage,
});

function MemoriesPage() {
  const { ownMemories, hydrated, session } = useAppState();

  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Memory[]>>();
    for (const memory of ownMemories) {
      const date = new Date(memory.created_at);
      const year = String(date.getFullYear());
      const month = date.toLocaleDateString("en-GB", { month: "long" }).toUpperCase();
      if (!map.has(year)) map.set(year, new Map());
      const months = map.get(year) as Map<string, Memory[]>;
      if (!months.has(month)) months.set(month, []);
      (months.get(month) as Memory[]).push(memory);
    }
    return map;
  }, [ownMemories]);

  return (
    <main className="min-h-svh bg-background pb-32">
      <div className="mx-auto w-full max-w-[44rem] px-6 pt-12 sm:px-10">
        <h1 className="label-xs">My Memories</h1>

        {!hydrated ? null : !session ? (
          <p className="mt-16 max-w-md font-serif text-lg leading-relaxed text-muted-foreground">
            Your archive appears once you have an account.{" "}
            <Link to="/auth" className="border-b border-foreground/30 text-foreground">
              Continue
            </Link>
          </p>
        ) : ownMemories.length === 0 ? (
          <p className="mt-16 max-w-md font-serif text-lg leading-relaxed text-muted-foreground">
            Nothing here yet. The first thing you leave behind will be kept in this archive, still
            attached to the place it belongs to.
          </p>
        ) : (
          <div className="mt-14">
            {[...grouped.entries()].map(([year, months], yearIndex) => (
              <motion.section
                key={year}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: yearIndex * 0.05 }}
                className="mb-16"
              >
                <h2 className="font-serif text-4xl tracking-[-0.02em] text-foreground/25">
                  {year}
                </h2>
                {[...months.entries()].map(([month, entries]) => (
                  <div key={month} className="mt-10">
                    <p className="label-xs">{month}</p>
                    <ul className="mt-5">
                      {entries.map((memory) => {
                        const bangla = isBangla(memory.content) || isBangla(memory.title ?? "");
                        return (
                          <li key={memory.id} className="border-t border-border">
                            <Link
                              to="/map"
                              search={{ story: memory.id }}
                              className="group block py-6 transition-opacity hover:opacity-100"
                            >
                              <p className="text-[0.8125rem] text-muted-foreground">
                                {memory.location_name}
                              </p>
                              <p
                                className={cn(
                                  "mt-2 font-serif text-xl leading-[1.45] text-foreground",
                                  bangla && "bn",
                                )}
                              >
                                {memory.title ?? excerpt(memory.content, 70)}
                              </p>
                              <p className="mt-3 flex items-center gap-3 text-xs text-subtle">
                                <span>{formatMemoryDate(memory.created_at)}</span>
                                <span aria-hidden>·</span>
                                <span>{memory.visibility}</span>
                                <span
                                  aria-hidden
                                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                  Return to the place →
                                </span>
                              </p>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </motion.section>
            ))}
          </div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
