"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { MapPin, Compass, Navigation, CheckCircle2 } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface ExperienceMap3DFeedbackProps {
  lat: number;
  lng: number;
  city?: string;
  district?: string;
  venueName?: string;
}

function CompassPin3D({ lat, lng }: { lat: number; lng: number }) {
  const pinGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (pinGroupRef.current) {
      pinGroupRef.current.rotation.y += delta * 0.8;
      pinGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2.5) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4;
    }
  });

  return (
    <group position={[0, -0.1, 0]}>
      {/* Horizontal compass base plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial color="#042F2C" roughness={0.3} metalness={0.4} />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.28, 32]} />
        <meshBasicMaterial color="#10B981" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating 3D Teardrop Pin */}
      <group ref={pinGroupRef} position={[0, 0.4, 0]}>
        {/* Pin Head */}
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.3, 24, 24]} />
          <meshStandardMaterial
            color="#059669"
            emissive="#10B981"
            emissiveIntensity={0.5}
            roughness={0.2}
          />
        </mesh>

        {/* Inner Orange Core */}
        <mesh position={[0, 0.45, 0.15]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
        </mesh>

        {/* Pin Tip Cone */}
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.26, 0.55, 24]} />
          <meshStandardMaterial color="#047857" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

export function ExperienceMap3DFeedback({
  lat,
  lng,
  city = "Mumbai",
  district = "Mumbai Suburban",
  venueName = "Selected Venue",
}: ExperienceMap3DFeedbackProps) {
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

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* 3D Mini Viewport */}
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
              <CompassPin3D lat={lat} lng={lng} />
            </Canvas>
          </div>
        </ErrorBoundary>
      ) : (
        <div className="w-20 h-20 rounded-xl bg-emerald-950 flex items-center justify-center shrink-0 border border-emerald-500/30">
          <MapPin className="w-8 h-8 text-emerald-400" />
        </div>
      )}

      {/* Selected Location Card & Telemetry */}
      <div className="flex-1 min-w-0 text-left space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Pin Telemetry Locked: {city || "Mumbai"}</span>
        </div>
        <div className="text-sm font-extrabold text-white truncate font-display">
          {venueName || "Meeting Location"}
        </div>
        <div className="text-[11px] text-slate-300 truncate">
          {district && `${district}, `}{city}
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
  );
}
export default ExperienceMap3DFeedback;
