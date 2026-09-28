"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Sparkles, Compass, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { MagneticButton } from "@/components/motion/MagneticButton";

const AIMatchingFlow3D = dynamic(
  () => import("@/components/3d/AIMatchingFlow3D").then((mod) => mod.AIMatchingFlow3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] flex items-center justify-center bg-slate-50/50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Loading AI Matching Engine...</span>
        </div>
      </div>
    ),
  }
);

export const HowItWorks3DSection: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-20 bg-gradient-to-b from-[#F8FAFC] to-white border-t border-slate-200/80 overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-teal-100/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="relative max-w-[1240px] mx-auto px-6">
        {/* Section Header */}
        <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-[#059669] border border-emerald-200/80 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
            SMART MATCHING ENGINE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
            How LocalLens Connects You With <span className="text-[#059669]">Qualified Travelers</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Our autonomous discovery engine analyzes traveler intent, location proximity, and local interests to drop confirmed bookings directly onto your schedule.
          </p>
        </ScrollReveal>

        {/* 3D Flow Card */}
        <ScrollReveal direction="up" delay={0.15} className="mb-14">
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
                <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                  Interactive AI Dispatch Pipeline
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#059669] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                END-TO-END TELEMETRY
              </span>
            </div>

            {/* 3D Connecting Flow Canvas */}
            <AIMatchingFlow3D />
          </div>
        </ScrollReveal>

        {/* 3 Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <ScrollReveal direction="up" delay={0.2} className="h-full">
            <div className="h-full p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center border border-emerald-100 shadow-2xs">
                  <Compass className="w-5 h-5 text-[#059669]" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  AI-Powered Discovery
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Travelers searching for coastal kayaking, heritage walks, or pottery are paired with your experience based on language, time slot, and budget.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-[#059669] flex items-center gap-1">
                <span>0% Ad Spend Required</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 2 */}
          <ScrollReveal direction="up" delay={0.3} className="h-full">
            <div className="h-full p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Automated Schedule &amp; SMS
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Receive instant notifications when bookings arrive. LocalLens automatically provides guests with pin-drop directions and meeting landmarks.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-blue-600 flex items-center gap-1">
                <span>Real-Time WhatsApp Updates</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Card 3 */}
          <ScrollReveal direction="up" delay={0.4} className="h-full">
            <div className="h-full p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300 space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-slate-900">
                  Guaranteed Instant Payouts
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  All guest payments are collected upfront via UPI or card. Your earnings are credited directly to your verified bank account without delays.
                </p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-amber-600 flex items-center gap-1">
                <span>Fast Bank Settlement</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom CTA Banner */}
        <ScrollReveal direction="up" delay={0.45} className="mt-14">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-[#064E3B] to-[#047857] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black">
                Ready to turn your local spot into a business?
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 font-normal">
                Join over 1,200 verified experience hosts across India in under 5 minutes.
              </p>
            </div>
            <Link href="/experiences/new">
              <MagneticButton className="px-6 py-3.5 rounded-xl bg-white text-[#064E3B] font-extrabold text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer shrink-0">
                <span>List Your Experience</span>
                <ArrowRight className="w-4 h-4 text-[#064E3B]" />
              </MagneticButton>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
