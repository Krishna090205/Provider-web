"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { buildProfileFromAuthUser, syncAuthenticatedUserProfile } from "@/lib/authSession";

export default function AuthCallbackPage() {
  const [statusMsg, setStatusMsg] = useState("Verifying authorization credentials...");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledRef = useRef(false);

  const completeAndNavigate = async (user: any) => {
    if (handledRef.current) return;
    handledRef.current = true;

    setStatusMsg("Setting up your provider profile...");

    if (user) {
      try {
        await Promise.race([
          syncAuthenticatedUserProfile(user),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      } catch (err: any) {
        console.warn("[OAuth Callback] Profile sync notice:", {
          message: err?.message,
        });
      }
    }

    setStatusMsg("Authentication successful! Redirecting to your dashboard...");
    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 200);
  };

  useEffect(() => {
    async function processOAuthCallback() {
      try {
        if (typeof window === "undefined") return;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const urlError = urlParams.get("error_description") || urlParams.get("error");

        if (urlError) {
          setErrorMsg(decodeURIComponent(urlError));
          return;
        }

        // 1. Check if active session is already established
        const { data: existingSession } = await supabase.auth.getSession();
        if (existingSession?.session?.user) {
          await completeAndNavigate(existingSession.session.user);
          return;
        }

        // 2. Listen for auth state change
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session?.user) {
            subscription.unsubscribe();
            await completeAndNavigate(session.user);
          }
        });

        // 3. Exchange authorization code for Supabase session (PKCE)
        if (code) {
          setStatusMsg("Exchanging code for session...");
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data?.session?.user) {
              await completeAndNavigate(data.session.user);
              return;
            }
          } catch {
            // Handled below via polling
          }

          // In Supabase client v2, detectSessionInUrl may auto-exchange the code in parallel.
          // Poll getSession() for up to 3 seconds before reporting failure.
          for (let attempt = 1; attempt <= 6; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            if (handledRef.current) return;
            const { data: polledSession } = await supabase.auth.getSession();
            if (polledSession?.session?.user) {
              await completeAndNavigate(polledSession.session.user);
              return;
            }
          }

          setErrorMsg("Could not verify authorization code. Please return to login and try again.");
          return;
        }

        // 4. Fallback check for session
        setTimeout(async () => {
          if (handledRef.current) return;
          const { data: finalCheck } = await supabase.auth.getUser();
          if (finalCheck?.user) {
            await completeAndNavigate(finalCheck.user);
          } else {
            const saved = localStorage.getItem("locallens_provider_session");
            if (saved) {
              window.location.href = "/dashboard";
            } else {
              setErrorMsg("Authentication did not complete in time. Please try logging in again.");
            }
          }
        }, 3000);
      } catch (err: any) {
        setErrorMsg(err.message || "An unexpected error occurred during login.");
      }
    }

    processOAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full">
        {errorMsg ? (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-black">
              !
            </div>
            <h3 className="font-extrabold text-[#0F172A] text-lg">Login Notice</h3>
            <p className="text-xs text-red-600 leading-relaxed">{errorMsg}</p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block py-2 px-5 bg-[#00875A] hover:bg-[#00704A] text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Return to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 border-4 border-[#00875A] border-t-transparent rounded-full animate-spin mx-auto" />
            <h3 className="font-black text-[#0F172A] text-lg">Connecting with Google</h3>
            <p className="text-xs text-slate-500">{statusMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}