"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { Radar, Sparkles, Navigation, Users, Zap, ShieldCheck } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

interface BoostRadar3DProps {
  packageType?: "spark" | "push" | "surge";
  listingName?: string;
  estimatedReach?: number;
  radiusKm?: number;
  activeCampaignsCount?: number;
}

function RadarGrid({ packageType = "push" }: { packageType: "spark" | "push" | "surge" }) {
  const sweepRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  // Scaled radius depending on package
  const maxRadius = packageType === "surge" ? 4.2 : packageType === "push" ? 3.4 : 2.5;

  // Generate traveler dots in the radar field
  const travelerDots = useMemo(() => {
    const count = packageType === "surge" ? 65 : packageType === "push" ? 42 : 24;
    const dots: { pos: [number, number, number]; id: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.5 + Math.random() * (maxRadius - 0.6);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = (Math.random() - 0.5) * 0.25;
      dots.push({ pos: [x, y, z], id: i, speed: 0.2 + Math.random() * 0.4 });
    }
    return dots;
  }, [packageType, maxRadius]);

  useFrame((state, delta) => {
    // 360 rotating radar sweep
    if (sweepRef.current) {
      sweepRef.current.rotation.y += delta * 1.6;
    }

    // Concentric expanding sonar pulse rings
    const t = state.clock.elapsedTime;
    if (ring1Ref.current) {
      const s1 = ((t * 0.8) % 1) * maxRadius;
      ring1Ref.current.scale.set(s1, s1, 1);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - s1 / maxRadius));
    }
    if (ring2Ref.current) {
      const s2 = (((t * 0.8) + 0.33) % 1) * maxRadius;
      ring2Ref.current.scale.set(s2, s2, 1);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - s2 / maxRadius));
    }
    if (ring3Ref.current) {
      const s3 = (((t * 0.8) + 0.66) % 1) * maxRadius;
      ring3Ref.current.scale.set(s3, s3, 1);
      (ring3Ref.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - s3 / maxRadius));
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Base Radar Grid Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[maxRadius, 64]} />
        <meshBasicMaterial
          color="#04201A"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Static Concentric Range Rings */}
      {[0.33, 0.66, 1.0].map((frac, idx) => (
        <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[maxRadius * frac - 0.02, maxRadius * frac, 64]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Axis crosshair lines */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-maxRadius, 0, 0, maxRadius, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#059669" transparent opacity={0.3} />
      </line>
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([0, 0, -maxRadius, 0, 0, maxRadius]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#059669" transparent opacity={0.3} />
      </line>

      {/* Expanding Sonar Waves */}
      <mesh ref={ring1Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.0, 48]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring2Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.0, 48]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring3Ref} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.0, 48]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Rotating Radar Sweep Cone/Plane */}
      <group ref={sweepRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, maxRadius, 32, 1, 0, Math.PI / 3]} />
          <meshBasicMaterial
            color="#10B981"
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Central LocalLens Provider Beacon */}
      <group position={[0, 0.1, 0]}>
        <mesh>
          <cylinderGeometry args={[0.08, 0.18, 0.35, 16]} />
          <meshStandardMaterial color="#059669" emissive="#10B981" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Surrounding Traveler Ping Nodes */}
      {travelerDots.map((t) => (
        <TravelerNode key={t.id} dot={t} />
      ))}
    </group>
  );
}

function TravelerNode({ dot }: { dot: { pos: [number, number, number]; id: number; speed: number } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const offset = dot.id * 0.4;
      const s = 1 + Math.sin(state.clock.elapsedTime * 3 + offset) * 0.2;
      meshRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={dot.pos}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? "#FBBF24" : "#6EE7B7"}
          emissive={hovered ? "#F59E0B" : "#10B981"}
          emissiveIntensity={hovered ? 0.9 : 0.5}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={6} center>
          <div className="bg-slate-900/95 text-white px-2 py-1 rounded-lg border border-emerald-500/40 text-[9px] font-mono whitespace-nowrap shadow-lg pointer-events-none">
            Active Traveler in Radar Range
          </div>
        </Html>
      )}
    </group>
  );
}

// Graceful 2D Fallback
function BoostRadar2DFallback({
  packageType = "push",
  listingName,
  estimatedReach = 12000,
}: BoostRadar3DProps) {
  return (
    <div className="w-full h-full min-h-[300px] bg-[#041814] rounded-3xl p-6 text-white flex flex-col items-center justify-center border border-emerald-500/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative w-40 h-40 rounded-full border-2 border-emerald-500/30 flex items-center justify-center mb-4">
        <div className="w-28 h-28 rounded-full border border-emerald-500/25 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-emerald-500/40 flex items-center justify-center bg-emerald-500/10">
            <div className="w-4 h-4 rounded-full bg-amber-400 animate-pulse shadow-md" />
          </div>
        </div>
      </div>

      <div className="text-center space-y-1 relative z-10">
        <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
          3D Radar Telemetry &bull; {packageType.toUpperCase()}
        </div>
        <div className="text-2xl font-black text-white font-display">
          {estimatedReach.toLocaleString()} Travelers
        </div>
        <p className="text-xs text-slate-400 max-w-xs">
          High-priority feed boost &amp; rider-app discovery radar for {listingName || "your experience"}.
        </p>
      </div>
    </div>
  );
}

export function BoostRadar3D(props: BoostRadar3DProps) {
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
    return <BoostRadar2DFallback {...props} />;
  }

  const reachNum =
    props.estimatedReach ||
    (props.packageType === "surge"
      ? 35000
      : props.packageType === "push"
      ? 12000
      : 3500);

  return (
    <ErrorBoundary fallback={<BoostRadar2DFallback {...props} />}>
      <div className="w-full h-[320px] sm:h-[360px] relative select-none rounded-3xl overflow-hidden bg-gradient-to-b from-[#031512] to-[#020B09] border border-emerald-500/30 shadow-xl">
        <Canvas
          camera={{ position: [0, 3.8, 4.4], fov: 45 }}
          dpr={[1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[4, 6, 2]} intensity={1.2} color="#A7F3D0" />
          <pointLight position={[0, 1.5, 0]} intensity={1.5} color="#34D399" />

          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.2}>
            <RadarGrid packageType={props.packageType || "push"} />
          </Float>
        </Canvas>

        {/* Top-Left Live Radar Header */}
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-500/40 text-white flex items-center gap-2.5 shadow-lg pointer-events-none">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <div className="text-[11px] font-black text-emerald-400 font-mono tracking-wider uppercase">
              Live Traveler Reach Radar
            </div>
            <div className="text-[9.5px] text-slate-300 font-medium">
              360° Omnidirectional Scan Active
            </div>
          </div>
        </div>

        {/* Top-Right Reach Counter */}
        <div className="absolute top-4 right-4 z-10 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-emerald-500/40 text-right shadow-lg pointer-events-none">
          <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
            Target Reach
          </div>
          <div className="text-base font-black text-emerald-300 font-display">
            ~{reachNum.toLocaleString()}+ Guests
          </div>
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Center: Your Location</span>
            <span className="text-slate-600">&bull;</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Green Nodes: Active Nearby Travelers</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold hidden sm:inline">
            Status: OPTIMIZED
          </span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
export default BoostRadar3D;
