import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, Check, Search } from "lucide-react";
import { useState } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { QuietButton } from "@/components/ui/quiet";
import { searchPlaces } from "@/lib/data/places";
import { useAppState } from "@/lib/store";
import type { Place, Visibility } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leave")({
  head: () => ({
    meta: [
      { title: "Leave something here — A Map of Us" },
      {
        name: "description",
        content: "Attach a memory to the place where it happened. Public on the map, or private to you.",
      },
      { property: "og:title", content: "Leave something here — A Map of Us" },
      {
        property: "og:description",
        content: "Choose a place, write what you want to leave behind, and leave it there.",
      },
    ],
  }),
  component: LeavePage,
});

function LeavePage() {
  const { session, addMemory, hydrated } = useAppState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const results = place ? [] : searchPlaces(query);

  function submit() {
    if (!place || !content.trim()) return;
    const memory = addMemory({
      content,
      title: title.trim() || undefined,
      latitude: place.latitude,
      longitude: place.longitude,
      location_name: place.name,
      visibility,
    });
    if (memory) void navigate({ to: "/map", search: { story: memory.id } });
  }

  return (
    <main className="relative min-h-svh bg-background pb-32">
      <div className="mx-auto w-full max-w-[38rem] px-6 pt-8 sm:px-10">
        <Link
          to="/map"
          className="inline-flex items-center gap-2 text-xs tracking-[0.08em] text-subtle transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          Back to the map
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="mt-14 font-serif text-[2rem] leading-[1.2] tracking-[-0.015em] sm:text-[2.5rem]">
            Leave something here.
          </h1>

          {hydrated && !session ? (
            <div className="mt-10 border-t border-border pt-8">
              <p className="max-w-md font-serif text-lg leading-relaxed text-muted-foreground">
                You need an account before you leave something behind. Your name is never shown —
                only an anonymous ID.
              </p>
              <div className="mt-8">
                <QuietButton onClick={() => void navigate({ to: "/auth" })}>Continue</QuietButton>
              </div>
            </div>
          ) : (
            <>
              <section className="mt-14">
                <label htmlFor="place" className="label-xs">
                  Where did it happen?
                </label>
                {place ? (
                  <div className="mt-3 flex items-center justify-between border-b border-border pb-3">
                    <p className="font-serif text-lg text-foreground">{place.name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setPlace(null);
                        setQuery("");
                      }}
                      className="text-xs tracking-[0.06em] text-subtle hover:text-foreground"
                    >
                      change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 flex items-center gap-3 border-b border-border pb-3">
                      <Search className="h-4 w-4 text-subtle" strokeWidth={1.5} aria-hidden />
                      <input
                        id="place"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search for a place"
                        className="w-full bg-transparent font-serif text-lg text-foreground placeholder:text-subtle focus:outline-none"
                      />
                    </div>
                    {results.length ? (
                      <ul className="mt-2">
                        {results.map((option) => (
                          <li key={option.name}>
                            <button
                              type="button"
                              onClick={() => setPlace(option)}
                              className="block w-full py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {option.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              </section>

              <section className="mt-14">
                <label htmlFor="title" className="label-xs">
                  A first line, if you have one
                </label>
                <input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Optional"
                  className="mt-3 w-full border-b border-border bg-transparent pb-3 font-serif text-lg text-foreground placeholder:text-subtle focus:border-foreground/40 focus:outline-none"
                />
              </section>

              <section className="mt-14">
                <label htmlFor="content" className="label-xs">
                  What do you want to leave behind?
                </label>
                <textarea
                  id="content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={9}
                  placeholder="Write in Bangla, Banglish or English."
                  className="prose-story mt-4 w-full resize-none border-b border-border bg-transparent pb-4 placeholder:text-subtle focus:border-foreground/40 focus:outline-none"
                />
              </section>

              <section className="mt-14">
                <p className="label-xs">Visibility</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <VisibilityOption
                    active={visibility === "public"}
                    onClick={() => setVisibility("public")}
                    name="Public"
                    detail="Let others find it on the map."
                  />
                  <VisibilityOption
                    active={visibility === "private"}
                    onClick={() => setVisibility("private")}
                    name="Private"
                    detail="Keep it only for yourself."
                  />
                </div>
              </section>

              <div className="mt-14 flex items-center gap-6">
                <QuietButton onClick={submit} disabled={!place || !content.trim()}>
                  Leave it here
                </QuietButton>
                <p className="text-xs text-subtle">
                  Signed as{" "}
                  <span className="font-serif tracking-[0.06em] text-muted-foreground">
                    {session?.anonymous_id}
                  </span>
                </p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      <BottomNavigation />
    </main>
  );
}

function VisibilityOption({
  active,
  onClick,
  name,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  name: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-start justify-between gap-4 border p-4 text-left transition-colors",
        active ? "border-foreground/50 bg-surface" : "border-border hover:border-foreground/25",
      )}
    >
      <span>
        <span className="block text-sm text-foreground">{name}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{detail}</span>
      </span>
      {active ? <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden /> : null}
    </button>
  );
}
