import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Memory, Visibility } from "./types";
import {
  createMemory,
  getSession,
  listOwnMemories,
  listSaved,
  listVisibleMemories,
  signIn as repoSignIn,
  signOut as repoSignOut,
  toggleSaved as repoToggleSaved,
  type Session,
} from "./data/repository";
import { SAMPLE_MEMORIES } from "./data/sample-memories";

interface AppState {
  hydrated: boolean;
  session: Session | null;
  memories: Memory[];
  ownMemories: Memory[];
  saved: string[];
  signIn: (email: string) => Session;
  signOut: () => void;
  addMemory: (input: {
    content: string;
    title?: string | undefined;
    latitude: number;
    longitude: number;
    location_name: string;
    visibility: Visibility;
  }) => Memory | null;
  toggleSaved: (id: string) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [memories, setMemories] = useState<Memory[]>(SAMPLE_MEMORIES);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const s = getSession();
    setSession(s);
    setMemories(listVisibleMemories(s));
    setSaved(listSaved());
    setHydrated(true);
  }, []);

  const signIn = useCallback((email: string) => {
    const s = repoSignIn(email);
    setSession(s);
    setMemories(listVisibleMemories(s));
    return s;
  }, []);

  const signOut = useCallback(() => {
    repoSignOut();
    setSession(null);
    setMemories(listVisibleMemories(null));
  }, []);

  const addMemory = useCallback<AppState["addMemory"]>(
    (input) => {
      if (!session) return null;
      const memory = createMemory({ ...input, session });
      setMemories(listVisibleMemories(session));
      return memory;
    },
    [session],
  );

  const toggleSaved = useCallback((id: string) => {
    setSaved(repoToggleSaved(id));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      hydrated,
      session,
      memories,
      ownMemories: listOwnMemories(session),
      saved,
      signIn,
      signOut,
      addMemory,
      toggleSaved,
    }),
    [hydrated, session, memories, saved, signIn, signOut, addMemory, toggleSaved],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
