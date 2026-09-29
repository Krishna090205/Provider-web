"use client";

/**
 * Thin "use client" wrapper so the Server-Component root layout
 * can safely include LanguageProvider (which uses useState/useEffect).
 * Next.js App Router forbids `dynamic(ssr:false)` in Server Components,
 * but a "use client" re-export works perfectly.
 */
export { LanguageProvider } from "@/lib/i18n";
