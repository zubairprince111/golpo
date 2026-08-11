import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { QuietButton } from "@/components/ui/quiet";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — A Map of Us" },
      {
        name: "description",
        content: "Your anonymous ID and the memories you have left on the map of Bangladesh.",
      },
      { property: "og:title", content: "Profile — A Map of Us" },
      {
        property: "og:description",
        content: "No pictures, no followers. Only an anonymous ID and the places you marked.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, ownMemories, signOut, hydrated } = useAppState();
  const navigate = useNavigate();
  const publicCount = ownMemories.filter((m) => m.visibility === "public").length;
  const privateCount = ownMemories.length - publicCount;

  return (
    <main className="paper min-h-svh bg-background pb-32">
      <div className="mx-auto w-full max-w-[32rem] px-6 pt-12 sm:px-10">
        <h1 className="label-xs">Profile</h1>

        {!hydrated ? null : !session ? (
          <p className="mt-16 max-w-sm font-serif text-lg leading-relaxed text-muted-foreground">
            You are reading the map anonymously.{" "}
            <Link to="/auth" className="border-b border-foreground/30 text-foreground">
              Create an account
            </Link>{" "}
            to leave something behind.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-14"
          >
            <p className="label-xs">Anonymous ID</p>
            <p className="mt-3 font-serif text-[2.5rem] tracking-[0.1em] text-foreground">
              {session.anonymous_id}
            </p>
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-subtle">
              This is the only thing others ever see of you.
            </p>

            <dl className="mt-14 grid grid-cols-2 border-t border-border">
              <div className="border-r border-border py-6 pr-6">
                <dt className="label-xs">Public memories</dt>
                <dd className="mt-3 font-serif text-3xl">{publicCount}</dd>
              </div>
              <div className="py-6 pl-6">
                <dt className="label-xs">Private memories</dt>
                <dd className="mt-3 font-serif text-3xl">{privateCount}</dd>
              </div>
            </dl>

            <div className="mt-12 flex flex-col items-start gap-6 border-t border-border pt-8">
              <Link
                to="/memories"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Open my archive
              </Link>
              <QuietButton
                variant="outline"
                onClick={() => {
                  signOut();
                  void navigate({ to: "/map" });
                }}
              >
                Log out
              </QuietButton>
            </div>
          </motion.div>
        )}
      </div>
      <BottomNavigation />
    </main>
  );
}
