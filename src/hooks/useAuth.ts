"use client";

import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { buildProfileFromAuthUser, ProviderProfile, syncAuthenticatedUserProfile } from "@/lib/authSession";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // Synchronize localStorage immediately
    try {
      const saved = localStorage.getItem("locallens_provider_session");
      if (saved && saved.trim() && saved !== "undefined" && saved !== "null") {
        setProfile(JSON.parse(saved));
      }
    } catch (e) {
      try { localStorage.removeItem("locallens_provider_session"); } catch (_) {}
    }

    // 1. Initial Supabase check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        const p = buildProfileFromAuthUser(initialSession.user);
        setProfile(p);
        syncAuthenticatedUserProfile(initialSession.user)
          .then((synced) => {
            if (isMounted && synced) {
              setProfile(synced);
            }
          })
          .catch(() => {});
      } else {
        try {
          const saved = localStorage.getItem("locallens_provider_session");
          if (saved && saved.trim() && saved !== "undefined" && saved !== "null") {
            setProfile(JSON.parse(saved));
          }
        } catch (e) {}
      }
      setLoading(false);
    });

    // 2. Auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      if (currentSession?.user) {
        setUser(currentSession.user);
        const p = buildProfileFromAuthUser(currentSession.user);
        setProfile(p);
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          syncAuthenticatedUserProfile(currentSession.user)
            .then((synced) => {
              if (isMounted && synced) {
                setProfile(synced);
              }
            })
            .catch(() => {});
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        try {
          localStorage.removeItem("locallens_provider_session");
        } catch (e) {}
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("locallens_provider_session");
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user || !!session || !!profile,
    signOut,
  };
}
