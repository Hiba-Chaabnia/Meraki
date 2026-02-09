"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
      setProfile(data);
    },
    [supabase],
  );

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    /* Both paths are wrapped because `supabase.auth.getUser()` goes through
       `navigator.locks`, and a navigation while the lock is pending rejects it
       with an AbortError — "signal is aborted without reason". Floating, that
       surfaced as a runtime error overlay on a page change that had in fact
       succeeded. It is a cancellation, not a failure, so it is swallowed
       quietly; anything else is still reported.

       `isLoading` is cleared either way. Leaving it true on an aborted call
       would strand every consumer on its skeleton. */
    const aborted = (e: unknown) => e instanceof Error && e.name === "AbortError";

    const init = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
        if (currentUser) await fetchProfile(currentUser.id);
      } catch (e) {
        if (!aborted(e)) console.error("[UserProvider] Failed to load the session:", e);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (!newUser) {
        setProfile(null);
        return;
      }

      try {
        await fetchProfile(newUser.id);
      } catch (e) {
        if (!aborted(e)) console.error("[UserProvider] Failed to load the profile:", e);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  return (
    <UserContext.Provider
      value={{ user, profile, isLoading, refreshProfile, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
}

export { UserContext };
