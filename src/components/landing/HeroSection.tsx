"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Star, Globe2, Compass, Mountain } from "lucide-react";
import { ProviderBadge } from "./ProviderBadge";
import { HeroCTA } from "./HeroCTA";
import { ExperienceShowcase } from "./ExperienceShowcase";
import { SmoothNumber } from "@/components/motion/SmoothNumber";

const TerrainScene = dynamic(
  () => import("@/components/3d/TerrainScene").then((mod) => mod.TerrainScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[440px] flex items-center justify-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[#059669]">
          <div className="w-3.5 h-3.5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          <span>Preparing 3D Travel World...</span>
        </div>
      </div>
    ),
  }
);

const Hero3DCanvas = dynamic(
  () => import("@/components/3d/Hero3DCanvas").then((mod) => mod.Hero3DCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[410px] flex items-center justify-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-lg">
        <div className="flex items-center gap-2.5 text-xs font-bold text-[#059669]">
          <div className="w-3.5 h-3.5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
          <span>Preparing 3D Travel Sphere...</span>
        </div>
      </div>
    ),
  }
);

export const HeroSection: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [activeView, setActiveView] = useState<"terrain" | "globe" | "card">("terrain");

  useEffect(() => {
    // Trigger smooth entrance slide-in on load
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative w-full overflow-hidden flex flex-col justify-between min-h-[calc(100vh-76px)]">
      {/* Single Seamless 1080p Coastal Background Image (Zero Seams, Zero Layers) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/hero-coastal-bg.png"
          alt="Coastal paradise scenery"
          fill
          className="object-cover object-center scale-105 transition-transform duration-1000 ease-out"
          priority
          unoptimized
        />

        {/* Soft Focused Backlight behind Headline Text Only - Keeps coastal landscape, ocean & coconut trees 100% clear! */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 20% 32%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 45%, rgba(255,255,255,0.10) 75%, transparent 100%)",
          }}
        />
      </div>

      {/* Main Hero Content Container */}
      <div className="relative z-10 max-w-[1240px] w-full mx-auto px-6 pt-6 sm:pt-10 pb-2 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center w-full">
          {/* Left Column: Headline, Description & CTA */}
          <div
            className={`lg:col-span-6 xl:col-span-7 space-y-5 max-w-[660px] transform transition-all duration-700 ease-out ${
              mounted
                ? "translate-x-0 opacity-100"
                : "-translate-x-12 opacity-0"
            }`}
          >
            {/* Category Pill */}
            <div>
              <ProviderBadge />
            </div>

            {/* Main Hero Headline */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[58px] font-black text-[#0F172A] tracking-[-0.025em] leading-[1.04]">
              Turn Your Local Passion<br />
              Into a <span className="text-[#059669]">Thriving Business</span>
            </h1>

            {/* Hero Description */}
            <p className="text-[15.5px] sm:text-[16.5px] text-[#475569] leading-[1.55] max-w-[560px] font-normal">
              List your tours and workshops on LocalLens. AI matches you with qualified travelers, manages your schedule, and drops guests right at your door.
            </p>

            {/* CTA Buttons */}
            <div className="pt-1">
              <HeroCTA />
            </div>
          </div>

          {/* Right Column: 3D Travel World or Experience Showcase */}
          <div
            className={`lg:col-span-6 xl:col-span-5 relative flex flex-col items-center lg:items-end justify-center mt-4 lg:mt-0 transform transition-all duration-700 ease-out delay-150 ${
              mounted
                ? "translate-x-0 opacity-100"
                : "translate-x-12 opacity-0"
            }`}
          >
            {/* View Mode Switcher Pill */}
            <div className="mb-3 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 shadow-xs z-30">
              <button
                type="button"
                onClick={() => setActiveView("terrain")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeView === "terrain"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                <Mountain className="w-3.5 h-3.5" />
                <span>3D Travel Map</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("globe")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeView === "globe"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                <Globe2 className="w-3.5 h-3.5" />
                <span>3D Globe</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView("card")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeView === "card"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0F172A]"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Tour Card</span>
              </button>
            </div>

            {/* Active Visual Component */}
            <div className="w-full flex justify-center lg:justify-end">
              {activeView === "terrain" ? (
                <div className="w-full max-w-[480px] sm:max-w-[540px]">
                  <TerrainScene />
                </div>
              ) : activeView === "globe" ? (
                <div className="w-full max-w-[480px] sm:max-w-[530px]">
                  <Hero3DCanvas />
                </div>
              ) : (
                <ExperienceShowcase />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area: Left Floating Metrics Card (Floats over bottom-left coconut trees) */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 pb-4 pt-1 flex items-end justify-between">
        <div
          className={`animate-float-subtle bg-white/95 backdrop-blur-md rounded-[20px] sm:rounded-[22px] px-5 sm:px-7 py-3 sm:py-3.5 shadow-[0_16px_38px_rgba(15,23,42,0.14)] border border-white/80 flex items-center justify-between gap-4 sm:gap-6 w-full max-w-[580px] sm:max-w-[620px] hover:shadow-[0_22px_45px_rgba(15,23,42,0.18)] hover:-translate-y-1 transition-all duration-300 z-10 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Metric 1: 1,200+ Local Hosts (Monument Landmark Icon) */}
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-start">
            <div className="w-10 h-10 rounded-full bg-[#E0F7FA] text-[#00897B] flex items-center justify-center shrink-0 border border-[#B2EBF2]/60 shadow-sm">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M12 2L4 6v2h16V6l-8-4zM6 10v7H4v2h16v-2h-2v-7H6zm3 7v-5h2v5H9zm4 0v-5h2v5h-2z" />
              </svg>
            </div>
            <div>
              <div className="text-[18px] sm:text-[20px] font-black text-[#0F172A] leading-tight tracking-tight font-display">
                <SmoothNumber value={1200} suffix="+" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Local Hosts
              </div>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden sm:block h-7 w-[1px] bg-slate-200/80 shrink-0" />

          {/* Metric 2: ₹2.4 Cr Paid Out */}
          <div className="flex items-center gap-3 flex-1 justify-center">
            <div className="w-10 h-10 rounded-full bg-[#E8F8F0] text-[#059669] flex items-center justify-center shrink-0 border border-[#A7F3D0]/60 shadow-sm">
              <div className="w-4.5 h-4.5 rounded-full border-2 border-[#059669] flex items-center justify-center font-black text-xs">
                ₹
              </div>
            </div>
            <div>
              <div className="text-[18px] sm:text-[20px] font-black text-[#0F172A] leading-tight tracking-tight font-display">
                <SmoothNumber value={2.4} decimals={1} prefix="₹" suffix=" Cr" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Paid Out
              </div>
            </div>
          </div>

          {/* Divider 2 */}
          <div className="hidden sm:block h-7 w-[1px] bg-slate-200/80 shrink-0" />

          {/* Metric 3: 98% Positive Reviews */}
          <div className="flex items-center gap-3 flex-1 justify-center sm:justify-end">
            <div className="w-10 h-10 rounded-full bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center shrink-0 border border-[#FFEDD5]/80 shadow-sm">
              <Star className="w-4 h-4 fill-[#EA580C] text-[#EA580C]" />
            </div>
            <div>
              <div className="text-[18px] sm:text-[20px] font-black text-[#0F172A] leading-tight tracking-tight font-display">
                <SmoothNumber value={98} suffix="%" />
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Positive Reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating White Wave - Fixed at the very Down-Right Corner of the Screen (No Overlap) */}
      <div className="absolute bottom-0 right-0 z-20 pointer-events-none select-none animate-float-subtle [animation-delay:400ms]">
        <div className="relative w-[300px] sm:w-[360px] md:w-[410px] h-[105px] sm:h-[125px] md:h-[140px] filter drop-shadow-[0_12px_24px_rgba(15,23,42,0.12)]">
          <svg
            viewBox="0 0 410 140"
            className="w-full h-full block"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M 0 115 C 65 115, 105 45, 195 20 C 265 5, 345 8, 410 26 L 410 140 L 0 140 Z"
              fill="white"
              fillOpacity="0.98"
            />
          </svg>
          <div className="absolute right-4 sm:right-7 md:right-9 top-4 sm:top-6 md:top-7 text-right select-none">
            <div className="font-script text-[19px] sm:text-[22px] md:text-[25px] font-bold text-[#2A3E5C] leading-[1.22] tracking-wide drop-shadow-sm">
              <div>Real People</div>
              <div>Real Places</div>
              <div>Real Opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
