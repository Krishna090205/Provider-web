"use client";

import React, { useState } from "react";
import { LocalLensScene } from "./LocalLensScene";
import { TravelTerrain } from "./TravelTerrain";
import { RouteLines, RouteData } from "./RouteLines";
import { ExperienceMarkers, ExperienceMarkerItem } from "./ExperienceMarkers";
import { FloatingExperienceCard } from "./FloatingExperienceCard";
import { TravelParticles } from "./TravelParticles";
import { MapPin, Sparkles, Navigation } from "lucide-react";

const HERO_EXPERIENCES: ExperienceMarkerItem[] = [
  {
    id: "exp-1",
    name: "Sunset Kayaking",
    city: "Versova, Mumbai",
    price: "₹1,200",
    rating: 4.9,
    position: [-1.2, 0.1, 0.4],
  },
  {
    id: "exp-2",
    name: "Old Goa Heritage Walk",
    city: "Panaji, Goa",
    price: "₹1,500",
    rating: 4.8,
    position: [-0.3, 0.25, -0.6],
  },
  {
    id: "exp-3",
    name: "Amber Fort Secret Trails",
    city: "Jaipur, Rajasthan",
    price: "₹2,000",
    rating: 5.0,
    position: [1.1, 0.35, -0.2],
  },
  {
    id: "exp-4",
    name: "Munnar Tea Valley Trek",
    city: "Munnar, Kerala",
    price: "₹1,800",
    rating: 4.9,
    position: [0.6, 0.05, 0.9],
  },
];

const HERO_ROUTES: RouteData[] = [
  {
    start: [-1.2, 0.1, 0.4],
    end: [-0.3, 0.25, -0.6],
    heightOffset: 0.7,
    speed: 0.4,
  },
  {
    start: [-0.3, 0.25, -0.6],
    end: [1.1, 0.35, -0.2],
    heightOffset: 0.9,
    speed: 0.35,
  },
  {
    start: [1.1, 0.35, -0.2],
    end: [0.6, 0.05, 0.9],
    heightOffset: 0.8,
    speed: 0.45,
  },
];

export const TerrainScene: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [selectedExp, setSelectedExp] = useState<ExperienceMarkerItem>(HERO_EXPERIENCES[0]);

  return (
    <div className={`relative w-full h-full min-h-[440px] ${className}`}>
      <LocalLensScene
        cameraPosition={[0, 1.8, 5.2]}
        fov={42}
        enableParallax={true}
        height="h-[460px]"
        fallback={
          <div className="w-full h-full flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-emerald-50 to-slate-100 rounded-3xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-md">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">LocalLens Travel World</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Curated experiences from coastal Mumbai to high tea trails in Munnar.
            </p>
          </div>
        }
      >
        {/* Stylized Coastal Terrain with rolling green hills and blue water */}
        <TravelTerrain baseHeight={-0.45} enableBreathing={true} />

        {/* Dynamic Curved Flight Arcs with animated glowing traveler beads */}
        <RouteLines routes={HERO_ROUTES} />

        {/* Real Destination Experience Pins */}
        <ExperienceMarkers
          experiences={HERO_EXPERIENCES}
          selectedId={selectedExp.id}
          onSelect={(exp) => setSelectedExp(exp)}
        />

        {/* Floating Featured Experience Card */}
        <FloatingExperienceCard
          position={[1.4, 0.6, 0.4]}
          title={selectedExp.name}
          location={selectedExp.city || "India"}
          price={typeof selectedExp.price === "number" ? `₹${selectedExp.price}` : selectedExp.price || "₹1,200"}
          rating={selectedExp.rating || 4.9}
          image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80"
        />

        {/* Soft Atmospheric Discovery Particles */}
        <TravelParticles count={80} radius={3.6} />
      </LocalLensScene>

      {/* Floating UI Telemetry Badge */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
        <span className="text-[10px] font-black text-slate-800 tracking-wider uppercase flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#059669]" />
          3D Travel Map Active
        </span>
      </div>

      {/* Quick Location Switcher Pills */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-center gap-2 overflow-x-auto py-1">
        {HERO_EXPERIENCES.map((exp) => (
          <button
            key={exp.id}
            type="button"
            onClick={() => setSelectedExp(exp)}
            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
              selectedExp.id === exp.id
                ? "bg-[#059669] text-white shadow-md ring-2 ring-emerald-400/40"
                : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200"
            }`}
          >
            <MapPin className="w-2.5 h-2.5" />
            <span>{exp.city?.split(",")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
