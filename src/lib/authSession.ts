import { supabase } from "./supabaseClient";

export interface ProviderProfile {
  id?: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: string;
  providerCategory?: string;
  avatar?: string;
  authProvider?: "google" | "apple" | "email" | "demo";
  verified?: boolean; // false until Aadhaar OCR verification is completed!
  aadhaarVerified?: boolean;
  aadhaarNumber?: string;
  aadhaarName?: string;
  aadhaarDob?: string;
  aadhaarGender?: string;
  aadhaarAddress?: string;
  aadhaarScanDate?: string;
  rating?: number;
  totalExperiences?: number;
  totalGuests?: number;
  joinedDate?: string;
  businessName?: string;
  bio?: string;
  language?: "en" | "hi" | "mr" | "bn";
}

const DEFAULT_PROFILE: ProviderProfile = {
  id: "host_default_guest",
  name: "Local Provider",
  fullName: "Local Provider",
  email: "provider@locallens.in",
  phone: "+91 98201 55432",
  role: "Tour Guide / Storyteller",
  providerCategory: "Tour Guide / Storyteller",
  avatar: "",
  authProvider: "google",
  verified: false,
  aadhaarVerified: false,
  rating: 4.9,
  totalExperiences: 4,
  totalGuests: 328,
  joinedDate: "Recent Member",
};

/**
 * Builds profile synchronously from Supabase auth user metadata (0ms execution)
 * Preserves verified / Aadhaar OCR state if previously completed
 */
export function buildProfileFromAuthUser(user: any): ProviderProfile {
  if (!user) return DEFAULT_PROFILE;

  const meta = user.user_metadata || {};
  const isGoogle = meta.iss?.includes("google") || user.app_metadata?.provider === "google";

  const displayName =
    meta.full_name ||
    meta.name ||
    user.email?.split("@")[0] ||
    "Local Provider";

  const avatarUrl =
    meta.avatar_url ||
    meta.picture ||
    "";

  const userEmail = user.email || meta.email || "provider@locallens.in";

  // Check saved session in localStorage to preserve completed Aadhaar verification
  let savedVerified = false;
  let savedAadhaarVerified = false;
  let savedAadhaarDetails: Partial<ProviderProfile> = {};

  if (typeof window !== "undefined") {
    try {
      const savedStr = localStorage.getItem("locallens_provider_session");
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (
          saved.id === user.id ||
          saved.email?.toLowerCase() === userEmail.toLowerCase()
        ) {
          savedVerified = Boolean(saved.verified);
          savedAadhaarVerified = Boolean(saved.aadhaarVerified);
          savedAadhaarDetails = {
            aadhaarNumber: saved.aadhaarNumber,
            aadhaarName: saved.aadhaarName,
            aadhaarDob: saved.aadhaarDob,
            aadhaarGender: saved.aadhaarGender,
            aadhaarAddress: saved.aadhaarAddress,
            aadhaarScanDate: saved.aadhaarScanDate,
          };
        }
      }
    } catch {}
  }

  const isAadhaarVerified = Boolean(
    meta.aadhaar_verified || meta.aadhaarVerified || savedAadhaarVerified
  );
  const isVerified = Boolean(
    (meta.verified || savedVerified || isAadhaarVerified) && isAadhaarVerified
  );

  return {
    id: user.id,
    name: displayName,
    fullName: displayName,
    email: userEmail,
    phone: meta.phone || "+91 98201 55432",
    role: meta.provider_category || meta.role || "Tour Guide / Storyteller",
    providerCategory: meta.provider_category || meta.role || "Tour Guide / Storyteller",
    avatar: avatarUrl,
    authProvider: isGoogle ? "google" : "email",
    verified: isVerified,
    aadhaarVerified: isAadhaarVerified,
    aadhaarNumber: meta.aadhaar_number || savedAadhaarDetails.aadhaarNumber,
    aadhaarName: meta.aadhaar_name || savedAadhaarDetails.aadhaarName,
    aadhaarDob: meta.aadhaar_dob || savedAadhaarDetails.aadhaarDob,
    aadhaarGender: meta.aadhaar_gender || savedAadhaarDetails.aadhaarGender,
    aadhaarAddress: meta.aadhaar_address || savedAadhaarDetails.aadhaarAddress,
    aadhaarScanDate: meta.aadhaar_scan_date || savedAadhaarDetails.aadhaarScanDate,
    rating: 4.9,
    totalExperiences: 4,
    totalGuests: 328,
    joinedDate: "Recent Member",
  };
}

export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// Track in-flight syncs by user ID to avoid duplicate/concurrent profile creation
const activeSyncPromises = new Map<string, Promise<ProviderProfile>>();

/**
 * Ensures an authenticated user's profile is synchronized in Supabase public.profiles table
 * - Validates active authenticated session exists before DB writes
 * - Uses authenticated user UUID (auth.uid())
 * - Checks existing row first; updates if found, upserts only if missing
 * - Restricts DB columns to exact schema: id, full_name, avatar_url, updated_at
 * - Deduplicates concurrent calls during OAuth callback, refresh, or dashboard init
 * - Safely logs code, message, details, hint on error without leaking tokens
 */
export async function syncAuthenticatedUserProfile(
  user: any,
  fallbackName?: string,
  fallbackAvatar?: string
): Promise<ProviderProfile> {
  const profile = buildProfileFromAuthUser(user);
  if (fallbackName && (!profile.fullName || profile.fullName === "Local Provider")) {
    profile.fullName = fallbackName;
    profile.name = fallbackName;
  }
  if (fallbackAvatar && !profile.avatar) {
    profile.avatar = fallbackAvatar;
  }

  // 1. Immediately persist to localStorage for 0ms synchronous retrieval
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("locallens_provider_session", JSON.stringify(profile));
    } catch {}
  }

  // Ensure user object has valid UUID
  const rawId = user?.id || profile.id;
  if (!rawId || !isValidUUID(rawId)) {
    return profile;
  }

  const userId = rawId;

  // Deduplicate concurrent sync calls for the exact same user ID
  if (activeSyncPromises.has(userId)) {
    return activeSyncPromises.get(userId)!;
  }

  const syncPromise = (async (): Promise<ProviderProfile> => {
    try {
      // 2. Verify active Supabase session is available
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.warn("[LocalLens Auth] Session verification notice:", {
          code: sessionErr.code,
          message: sessionErr.message,
        });
      }

      const session = sessionData?.session;
      const isAuthenticated = Boolean(session?.user?.id && session.user.id === userId);

      // Only attempt database writes if the authenticated session matches the user ID
      // This guarantees RLS WITH CHECK (auth.uid() = id) will evaluate to TRUE
      if (isAuthenticated) {
        // 3. Inspect existing profile row using authenticated user's UUID
        const { data: dbProfile, error: fetchErr } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, updated_at")
          .eq("id", userId)
          .maybeSingle();

        if (fetchErr) {
          console.warn("[LocalLens Auth] Profile check notice:", {
            code: fetchErr.code,
            message: fetchErr.message,
            details: fetchErr.details,
            hint: fetchErr.hint,
          });
        }

        const cleanName =
          dbProfile?.full_name ||
          profile.fullName ||
          profile.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Local Provider";

        const cleanAvatar =
          dbProfile?.avatar_url ||
          profile.avatar ||
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          "";

        // 4. Update existing profile OR upsert if row does not exist
        if (dbProfile) {
          const { error: updateErr } = await supabase
            .from("profiles")
            .update({
              full_name: cleanName,
              avatar_url: cleanAvatar,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateErr) {
            console.warn("[LocalLens Auth] Profile update notice:", {
              code: updateErr.code,
              message: updateErr.message,
              details: updateErr.details,
              hint: updateErr.hint,
            });
          }
        } else {
          // Row does not exist yet: upsert with ONLY the 4 valid schema columns
          const { error: upsertErr } = await supabase
            .from("profiles")
            .upsert(
              {
                id: userId,
                full_name: cleanName,
                avatar_url: cleanAvatar,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" }
            );

          if (upsertErr) {
            console.warn("[LocalLens Auth] Profile upsert notice:", {
              code: upsertErr.code,
              message: upsertErr.message,
              details: upsertErr.details,
              hint: upsertErr.hint,
            });
          }
        }

        // Keep local cache updated with resolved values
        profile.fullName = cleanName;
        profile.name = cleanName;
        profile.avatar = cleanAvatar;

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("locallens_provider_session", JSON.stringify(profile));
          } catch {}
        }
      }
    } catch (err: any) {
      console.warn("[LocalLens Auth] Profile sync catch notice:", {
        message: err?.message,
      });
    } finally {
      activeSyncPromises.delete(userId);
    }
    return profile;
  })();

  activeSyncPromises.set(userId, syncPromise);
  return syncPromise;
}

/**
 * Gets or creates provider profile with non-blocking DB sync for instant response
 */
export async function getOrCreateProviderProfile(user: any): Promise<ProviderProfile> {
  return syncAuthenticatedUserProfile(user);
}

/**
 * Completes Aadhaar OCR Verification for the provider
 * Sets verified: true, aadhaarVerified: true, stores extracted details,
 * and notifies active components.
 */
export async function completeAadhaarVerification(details: {
  aadhaarNumber: string;
  aadhaarName: string;
  aadhaarDob: string;
  aadhaarGender: string;
  aadhaarAddress?: string;
  aadhaarCardImage?: string;
}): Promise<ProviderProfile> {
  const current = (await getProviderProfile()) || DEFAULT_PROFILE;
  const updated: ProviderProfile = {
    ...current,
    verified: true,
    aadhaarVerified: true,
    aadhaarNumber: details.aadhaarNumber,
    aadhaarName: details.aadhaarName,
    aadhaarDob: details.aadhaarDob,
    aadhaarGender: details.aadhaarGender,
    aadhaarAddress: details.aadhaarAddress || "Verified Resident of India",
    aadhaarScanDate: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("locallens_provider_session", JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("locallens_profile_updated", { detail: updated })
    );
  }

  // Non-blocking sync to Supabase auth metadata and profiles table
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id || (isValidUUID(updated.id) ? updated.id : null);
    if (userId && isValidUUID(userId)) {
      await supabase
        .from("profiles")
        .update({
          full_name: updated.fullName || updated.name,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      await supabase.auth.updateUser({
        data: {
          verified: true,
          aadhaar_verified: true,
          aadhaar_number: details.aadhaarNumber,
        },
      });
    }
  } catch (e) {
    console.warn("Supabase Aadhaar completion sync notice:", e);
  }

  return updated;
}

/**
 * Resets Aadhaar verification state (useful for re-testing OCR verification)
 */
export async function resetAadhaarVerification(): Promise<ProviderProfile> {
  const current = (await getProviderProfile()) || DEFAULT_PROFILE;
  const updated: ProviderProfile = {
    ...current,
    verified: false,
    aadhaarVerified: false,
    aadhaarNumber: undefined,
    aadhaarName: undefined,
    aadhaarDob: undefined,
    aadhaarGender: undefined,
    aadhaarAddress: undefined,
    aadhaarScanDate: undefined,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("locallens_provider_session", JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("locallens_profile_updated", { detail: updated })
    );
  }
  return updated;
}

/**
 * Loads current provider profile with instant synchronous localStorage check first
 */
export async function getProviderProfile(): Promise<ProviderProfile | null> {
  if (typeof window === "undefined") {
    return DEFAULT_PROFILE;
  }

  // Fast path: localStorage
  try {
    const saved = localStorage.getItem("locallens_provider_session");
    if (saved && saved.trim() && saved !== "undefined" && saved !== "null") {
      const parsed = JSON.parse(saved);
      // Validate session in background
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          getOrCreateProviderProfile(data.session.user);
        }
      }).catch(() => {});
      return parsed;
    }
  } catch (err) {
    try {
      localStorage.removeItem("locallens_provider_session");
    } catch (_) {}
    console.error("Error reading localStorage profile:", err);
  }

  // Supabase active session check
  try {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      return await getOrCreateProviderProfile(data.session.user);
    }
  } catch (err) {
    console.error("Error reading Supabase session:", err);
  }

  return null;
}

/**
 * Saves provider profile to localStorage and updates state
 */
export function saveProviderProfile(profile: Partial<ProviderProfile>): ProviderProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;

  let current = DEFAULT_PROFILE;
  try {
    const currentStr = localStorage.getItem("locallens_provider_session");
    if (currentStr && currentStr.trim() && currentStr !== "undefined" && currentStr !== "null") {
      current = JSON.parse(currentStr);
    }
  } catch (_) {
    current = DEFAULT_PROFILE;
  }

  const rawEmail = (profile.email || current.email || "").trim().toLowerCase();
  const emailSlug = rawEmail.replace(/[^a-z0-9]/g, "_");
  const stableId = profile.id || (current.id && current.id !== "host_default_guest" ? current.id : (emailSlug ? `provider_${emailSlug}` : `provider_${Date.now()}`));

  const updated: ProviderProfile = {
    ...current,
    ...profile,
    id: stableId,
    name: profile.fullName || profile.name || current.name,
  };

  try {
    localStorage.setItem("locallens_provider_session", JSON.stringify(updated));
    if (rawEmail) {
      localStorage.setItem("locallens_last_provider_email", rawEmail);
    }
  } catch (_) {}
  return updated;
}

/**
 * Clears provider session and logs out
 */
export async function logoutProvider(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("locallens_provider_session");
  }
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Error signing out from Supabase:", err);
  }
}
