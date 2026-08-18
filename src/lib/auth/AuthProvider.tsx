import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";
import { fetchProfile } from "@/lib/auth/api";
import { AuthDialog } from "@/components/auth/AuthDialog";

type AuthMode = "login" | "signup";
type EnsureAuthResult = User | null;

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  openAuth: (mode?: AuthMode) => void;
  ensureAuth: (mode?: AuthMode) => Promise<EnsureAuthResult>;
  setProfile: (profile: Profile | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const waiters = useRef<Array<(user: EnsureAuthResult) => void>>([]);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      const next = await fetchProfile(userId);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      void loadProfile(data.session?.user.id).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setTimeout(() => {
        void loadProfile(nextSession?.user.id);
      }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const resolveWaiters = useCallback((user: EnsureAuthResult) => {
    const pending = waiters.current;
    waiters.current = [];
    pending.forEach((resolve) => resolve(user));
  }, []);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const ensureAuth = useCallback(
    (mode: AuthMode = "login") => {
      if (session?.user) return Promise.resolve(session.user);
      setAuthMode(mode);
      setAuthOpen(true);
      return new Promise<EnsureAuthResult>((resolve) => {
        waiters.current.push(resolve);
      });
    },
    [session],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setAuthOpen(open);
      if (!open && !session?.user) {
        resolveWaiters(null);
      }
    },
    [resolveWaiters, session],
  );

  useEffect(() => {
    if (session?.user && waiters.current.length > 0) {
      resolveWaiters(session.user);
      setAuthOpen(false);
    }
  }, [resolveWaiters, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      user: session?.user ?? null,
      profile,
      refreshProfile: () => loadProfile(session?.user.id),
      openAuth,
      ensureAuth,
      setProfile,
    }),
    [ensureAuth, loadProfile, loading, openAuth, profile, session],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthDialog open={authOpen} onOpenChange={handleOpenChange} mode={authMode} onModeChange={setAuthMode} />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
