"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  MapPin, Navigation, Loader2, Search, X, CheckCircle2, AlertCircle,
} from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExperienceMap3DFeedbackProps {
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  venueName?: string;
  /** Optional: called when user picks a location via search or GPS */
  onLocationChange?: (loc: {
    lat: number;
    lng: number;
    venueName: string;
    city: string;
    district: string;
    state: string;
  }) => void;
}

type LocationStatus = "idle" | "detecting" | "located" | "error" | "searching";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
}

// ─── 3D Pin ───────────────────────────────────────────────────────────────────

function CompassPin3D({ pulsing }: { pulsing: boolean }) {
  const pinGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (pinGroupRef.current) {
      pinGroupRef.current.rotation.y += delta * 0.8;
      pinGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
    }
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.4;
    if (pulseRef.current && pulsing) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
      pulseRef.current.scale.setScalar(scale);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
    }
  });

  return (
    <group position={[0, -0.1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial color="#042F2C" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.28, 32]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {pulsing && (
        <mesh ref={pulseRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.28, 32]} />
          <meshBasicMaterial color="#34D399" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}
      <group ref={pinGroupRef} position={[0, 0.4, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial
            color="#059669"
            emissive="#10B981"
            emissiveIntensity={pulsing ? 1.2 : 0.5}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.45, 0.15]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.26, 0.55, 24]} />
          <meshStandardMaterial color="#047857" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Reverse Geocode ──────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const a = data.address || {};
    return {
      venueName: data.display_name?.split(",")[0] || "Selected Location",
      city: a.city || a.town || a.village || a.county || "",
      district: a.suburb || a.county || "",
      state: a.state || "",
    };
  } catch {
    return null;
  }
}

// ─── Search Nominatim ─────────────────────────────────────────────────────────

async function searchPlaces(query: string): Promise<NominatimResult[]> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { "Accept-Language": "en" } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExperienceMap3DFeedback({
  lat,
  lng,
  city = "",
  district = "",
  venueName = "",
  onLocationChange,
}: ExperienceMap3DFeedbackProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("Live Location");
  const [resolvedVenue, setResolvedVenue] = useState(venueName);
  const [resolvedCity, setResolvedCity] = useState(city);
  const [resolvedDistrict, setResolvedDistrict] = useState(district);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // WebGL check
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Reverse-geocode when lat/lng change from parent (map pin drop)
  useEffect(() => {
    if (!lat || !lng) return;
    setStatus("detecting");
    setStatusMsg("Resolving location…");
    reverseGeocode(lat, lng).then((info) => {
      if (info) {
        setResolvedVenue(info.venueName || venueName);
        setResolvedCity(info.city || city);
        setResolvedDistrict(info.district || district);
        setStatus("located");
        setStatusMsg(`Live · ${info.city || city}`);
      } else {
        setStatus("located");
        setStatusMsg(`Live · ${city}`);
      }
    });
  }, [lat, lng]);

  // Debounced search
  const handleSearchInput = useCallback((q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setShowResults(false); return; }
    setSearchLoading(true);
    setShowResults(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchPlaces(q);
      setSearchResults(results);
      setSearchLoading(false);
    }, 450);
  }, []);

  // GPS button
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setStatusMsg("GPS not supported");
      return;
    }
    setStatus("detecting");
    setStatusMsg("Detecting GPS…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setStatus("detecting");
        setStatusMsg("Resolving address…");
        const info = await reverseGeocode(latitude, longitude);
        const venue = info?.venueName || "Current Location";
        const c = info?.city || "";
        const d = info?.district || "";
        const s = info?.state || "";
        setResolvedVenue(venue);
        setResolvedCity(c);
        setResolvedDistrict(d);
        setStatus("located");
        setStatusMsg(`Live GPS · ${c}`);
        onLocationChange?.({ lat: latitude, lng: longitude, venueName: venue, city: c, district: d, state: s });
      },
      () => {
        setStatus("error");
        setStatusMsg("GPS access denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onLocationChange]);

  // Pick search result
  const handlePickResult = useCallback((r: NominatimResult) => {
    const a = r.address;
    const lat2 = parseFloat(r.lat);
    const lng2 = parseFloat(r.lon);
    const venue = r.display_name.split(",")[0];
    const c = a.city || a.town || a.village || a.county || "";
    const d = a.suburb || a.county || "";
    const s = a.state || "";
    setResolvedVenue(venue);
    setResolvedCity(c);
    setResolvedDistrict(d);
    setStatus("located");
    setStatusMsg(`Live · ${c}`);
    setSearchQuery(r.display_name.split(",").slice(0, 2).join(", "));
    setShowResults(false);
    onLocationChange?.({ lat: lat2, lng: lng2, venueName: venue, city: c, district: d, state: s });
  }, [onLocationChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const statusColor =
    status === "located" ? "text-emerald-400" :
    status === "error" ? "text-red-400" :
    status === "detecting" ? "text-yellow-400" :
    "text-slate-400";

  const StatusIcon =
    status === "located" ? CheckCircle2 :
    status === "error" ? AlertCircle :
    status === "detecting" ? Loader2 :
    Navigation;

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-emerald-500/30 shadow-md overflow-visible">
      {/* Top row: 3D pin + location info */}
      <div className="flex items-center gap-4 p-4">
        {/* 3D Viewport */}
        {webglSupported !== false ? (
          <ErrorBoundary
            fallback={
              <div className="w-20 h-20 rounded-xl bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MapPin className="w-8 h-8 text-emerald-400" />
              </div>
            }
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 relative shrink-0">
              <Canvas
                camera={{ position: [0, 1.4, 2.5], fov: 45 }}
                dpr={[1, 1.25]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                className="w-full h-full"
              >
                <ambientLight intensity={0.8} />
                <directionalLight position={[2, 3, 2]} intensity={1.5} color="#D1FAE5" />
                <CompassPin3D pulsing={status === "detecting"} />
              </Canvas>
            </div>
          </ErrorBoundary>
        ) : (
          <div className="w-20 h-20 rounded-xl bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <MapPin className="w-8 h-8 text-emerald-400" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className={`flex items-center gap-1.5 text-xs font-black ${statusColor}`}>
            <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${status === "detecting" ? "animate-spin" : ""}`} />
            <span className="truncate">{statusMsg || "Live Location"}</span>
          </div>
          <div className="text-sm font-extrabold text-white truncate">
            {resolvedVenue || venueName || "No location selected"}
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {resolvedDistrict && `${resolvedDistrict}, `}{resolvedCity}
          </div>
          <div className="pt-1 flex items-center gap-2 text-[10px] font-mono text-emerald-300">
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              LAT: {lat.toFixed(6)}
            </span>
            <span className="bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              LNG: {lng.toFixed(6)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Search + GPS */}
      <div className="border-t border-emerald-500/20 px-4 pb-4 pt-3 space-y-2">
        <div className="flex gap-2">
          {/* Search bar */}
          <div ref={searchRef} className="relative flex-1">
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 hover:border-emerald-500/60 focus-within:border-emerald-500 rounded-xl px-3 py-2 transition-colors">
              {searchLoading
                ? <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                : <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              }
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => searchQuery && setShowResults(true)}
                placeholder="Search location…"
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 outline-none min-w-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setSearchResults([]); setShowResults(false); }}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown results */}
            {showResults && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                {searchLoading ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-500">No results found</div>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={r.place_id}
                      type="button"
                      onClick={() => handlePickResult(r)}
                      className="w-full text-left px-3 py-2.5 hover:bg-emerald-500/10 border-b border-slate-700/50 last:border-0 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">
                            {r.display_name.split(",")[0]}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {r.display_name.split(",").slice(1, 3).join(",")}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* GPS button */}
          <button
            type="button"
            onClick={handleGPS}
            title="Use my current GPS location"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Location</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExperienceMap3DFeedback;
