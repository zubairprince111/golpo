import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { QuietButton } from "@/components/ui/quiet";
import { useAppState } from "@/lib/store";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — A Map of Us" },
      {
        name: "description",
        content:
          "Create an account to leave memories on the map. Your identity stays private — only an anonymous ID is shown.",
      },
      { property: "og:title", content: "Sign in — A Map of Us" },
      {
        property: "og:description",
        content: "An account keeps memories accountable. The map keeps them anonymous.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, session } = useAppState();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      setError("Enter an email address and a password of at least six characters.");
      return;
    }
    signIn(email);
    void navigate({ to: "/leave" });
  }

  return (
    <main className="paper relative min-h-svh bg-background">
      <div className="mx-auto w-full max-w-[26rem] px-6 pt-8 pb-24">
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
          className="mt-24"
        >
          <h1 className="font-serif text-[1.875rem] leading-[1.2] tracking-[-0.015em]">
            {session ? "You are already here." : "Before you leave something."}
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            An account exists only so memories can be owned and moderated. Nobody ever sees your
            email or name — the map shows an anonymous ID.
          </p>

          {session ? (
            <div className="mt-10">
              <p className="label-xs">Your anonymous ID</p>
              <p className="mt-2 font-serif text-2xl tracking-[0.08em]">{session.anonymous_id}</p>
              <div className="mt-8">
                <QuietButton onClick={() => void navigate({ to: "/leave" })}>
                  Leave something here
                </QuietButton>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-12">
              <label htmlFor="email" className="label-xs">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full border-b border-border bg-transparent pb-2.5 text-[0.9375rem] focus:border-foreground/40 focus:outline-none"
              />

              <label htmlFor="password" className="label-xs mt-10 block">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full border-b border-border bg-transparent pb-2.5 text-[0.9375rem] focus:border-foreground/40 focus:outline-none"
              />

              {error ? (
                <p role="alert" className="mt-6 text-xs leading-relaxed text-foreground/80">
                  {error}
                </p>
              ) : null}

              <div className="mt-12">
                <QuietButton type="submit">Continue</QuietButton>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-subtle">
                New here? Continuing creates your account and issues your anonymous ID.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </main>
  );
}
