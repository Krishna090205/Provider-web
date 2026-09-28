"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import { Compass, Users, Sparkles, MapPin, Eye } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface ExperienceItem {
  id: string;
  name: string;
  category?: string;
  city?: string;
  price?: string | number;
  rating?: number;
}

interface Dashboard3DGlobeProps {
  experiences?: ExperienceItem[];
  totalGuests?: number;
  activeCount?: number;
}

function ExperienceNodes({
  experiences,
}: {
  experiences: ExperienceItem[];
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [activeExp, setActiveExp] = useState<ExperienceItem | null>(null);

  // Position experiences on the 3D hemisphere
  const nodePositions = useMemo(() => {
    const list = experiences.length > 0
      ? experiences.slice(0, 6)
      : [
          { id: "1", name: "Versova Sunset Kayaking", city: "Mumbai", price: 1200, rating: 4.9 },
          { id: "2", name: "Old Goa Heritage Walk", city: "Goa", price: 850, rating: 4.8 },
          { id: "3", name: "Pottery & Blue Art", city: "Jaipur", price: 1500, rating: 5.0 },
        ];

    return list.map((exp, idx) => {
      const angle = (idx / list.length) * Math.PI * 2;
      const radius = 1.8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (Math.sin(idx * 2) * 0.4) + 0.2;
      return { exp, pos: [x, y, z] as [number, number, number] };
    });
  }, [experiences]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central Emerald Beacon Core */}
      <Sphere args={[1.3, 32, 32]}>
        <meshStandardMaterial
          color="#064E3B"
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Orbit Rings */}
      <mesh rotation={[Math.PI / 4, 0, 0]}>
        <ringGeometry args={[1.9, 1.95, 48]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[-Math.PI / 4, 0, 0]}>
        <ringGeometry args={[2.1, 2.14, 48]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Experience Hotspot Markers */}
      {nodePositions.map(({ exp, pos }, i) => (
        <group key={exp.id || i} position={pos}>
          {/* Pulsing ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.16, 16]} />
            <meshBasicMaterial
              color={activeExp?.id === exp.id ? "#F59E0B" : "#10B981"}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Marker Sphere */}
          <mesh
            onPointerOver={() => setActiveExp(exp)}
            onPointerOut={() => setActiveExp(null)}
          >
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial
              color={activeExp?.id === exp.id ? "#FBBF24" : "#34D399"}
              emissive={activeExp?.id === exp.id ? "#F59E0B" : "#059669"}
              emissiveIntensity={0.6}
            />
          </mesh>

          {/* Tooltip in 3D */}
          {activeExp?.id === exp.id && (
            <Html distanceFactor={5} center>
              <div className="bg-slate-900/95 text-white p-2.5 px-3 rounded-xl border border-emerald-500/40 shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap animate-fadeIn scale-90">
                <div className="text-[11px] font-extrabold text-emerald-400">
                  {exp.name}
                </div>
                <div className="text-[9.5px] text-slate-300 font-medium mt-0.5">
                  {exp.city || "Mumbai"} &bull; ₹{exp.price || 1200}
                </div>
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

// Graceful 2D Fallback
function Dashboard2DFallback({
  experiences,
  totalGuests,
  activeCount,
}: Dashboard3DGlobeProps) {
  return (
    <div className="w-full h-full min-h-[220px] bg-slate-900/95 rounded-2xl p-5 text-white flex flex-col justify-between border border-emerald-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">Active Experience Radar</div>
            <div className="text-[10px] text-emerald-400 font-medium">Telemetry Online</div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          2D SAFE MODE
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 py-3">
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm font-black text-white">{activeCount || 4}</div>
          <div className="text-[9px] text-slate-400 font-medium">Live Listings</div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm font-black text-emerald-400">₹48.5k</div>
          <div className="text-[9px] text-slate-400 font-medium">Month Payout</div>
        </div>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-sm font-black text-amber-400">{totalGuests || 328}</div>
          <div className="text-[9px] text-slate-400 font-medium">Total Guests</div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-white/10 pt-2">
        <span>Hotspots: Versova Beach, Old Goa, Jaipur</span>
        <span className="text-emerald-400 font-semibold">100% Verified</span>
      </div>
    </div>
  );
}

export function Dashboard3DGlobe(props: Dashboard3DGlobeProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }
  }, []);

  if (webglSupported === false) {
    return <Dashboard2DFallback {...props} />;
  }

  return (
    <ErrorBoundary fallback={<Dashboard2DFallback {...props} />}>
      <div className="w-full h-[240px] sm:h-[260px] relative select-none rounded-2xl overflow-hidden bg-gradient-to-b from-[#061816] to-[#041210] border border-emerald-500/20 shadow-md">
        <Canvas
          camera={{ position: [0, 0.8, 3.8], fov: 42 }}
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 2]} intensity={1.2} color="#D1FAE5" />
          <pointLight position={[-3, -2, -2]} intensity={0.5} color="#059669" />

          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
            <ExperienceNodes experiences={props.experiences || []} />
          </Float>
        </Canvas>

        {/* Overlay Telemetry Badge */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-extrabold text-emerald-300 font-mono tracking-tight bg-slate-900/80 px-2 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            Live 3D Listing Sphere
          </span>
        </div>

        <div className="absolute bottom-3 right-3 z-10 text-[9.5px] font-medium text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm pointer-events-none">
          Hover node to inspect listing
        </div>
      </div>
    </ErrorBoundary>
  );
}
export default Dashboard3DGlobe;
