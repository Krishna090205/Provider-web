"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
import { MapPin, Sparkles, Navigation } from "lucide-react";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Destination markers for Indian local travel hotspots
const DESTINATIONS = [
  { name: "Versova, Mumbai", position: [1.2, 0.4, 1.5] as [number, number, number], category: "Coastal Kayaking", rating: "4.9" },
  { name: "Old Goa", position: [1.1, -0.2, 1.7] as [number, number, number], category: "Heritage Walk", rating: "4.8" },
  { name: "Jaipur, Rajasthan", position: [0.6, 1.1, 1.6] as [number, number, number], category: "Pottery & Crafts", rating: "5.0" },
  { name: "Munnar, Kerala", position: [0.9, -1.0, 1.5] as [number, number, number], category: "Tea Plantation Trek", rating: "4.9" },
  { name: "Manali, HP", position: [0.4, 1.8, 1.1] as [number, number, number], category: "Himalayan Stays", rating: "4.9" },
];

// Stylized 3D Globe with Continent Grid Points & Atmospheric Glow
function TravelGlobe() {
  const globeGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  // Generate continent-like particles on sphere surface
  const particles = useMemo(() => {
    const pts: [number, number, number][] = [];
    const count = 380;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      const radius = 2.1;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      pts.push([x, y, z]);
    }
    return pts;
  }, []);

  useFrame((state, delta) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += delta * 0.12;
      globeGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.06;
    }
  });

  return (
    <group ref={globeGroupRef} position={[0, 0, 0]}>
      {/* Translucent Emerald Globe Core */}
      <Sphere args={[2.0, 48, 48]}>
        <meshStandardMaterial
          color="#042F2C"
          roughness={0.4}
          metalness={0.2}
          transparent
          opacity={0.88}
        />
      </Sphere>

      {/* Atmospheric Halo */}
      <Sphere args={[2.14, 32, 32]}>
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Outer Orbit Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.7, 2.76, 64]} />
        <meshBasicMaterial
          color="#34D399"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Surface Terrain Nodes */}
      {particles.map((pt, idx) => (
        <mesh key={idx} position={pt}>
          <sphereGeometry args={[0.024, 8, 8]} />
          <meshBasicMaterial
            color={idx % 4 === 0 ? "#6EE7B7" : "#059669"}
            transparent
            opacity={0.75}
          />
        </mesh>
      ))}

      {/* Interactive Destination 3D Markers */}
      {DESTINATIONS.map((dest, i) => (
        <DestinationPin key={dest.name} dest={dest} index={i} />
      ))}

      {/* Curved Flight / Travel Routes connecting nodes */}
      <RouteArcs />
    </group>
  );
}

// Glowing Location Marker with Interactive Tooltip
function DestinationPin({
  dest,
  index,
}: {
  dest: (typeof DESTINATIONS)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const pinRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (pinRef.current) {
      const offset = index * 1.2;
      const s = 1 + Math.sin(state.clock.elapsedTime * 2.5 + offset) * 0.12;
      pinRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group ref={pinRef} position={dest.position}>
      {/* Outer Pulse Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.08, 0.14, 24]} />
        <meshBasicMaterial
          color={hovered ? "#F59E0B" : "#10B981"}
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Central Glowing Pin Dot */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#FBBF24" : "#34D399"}
          emissive={hovered ? "#F59E0B" : "#059669"}
          emissiveIntensity={hovered ? 0.8 : 0.4}
        />
      </mesh>

      {/* Mini Tooltip overlay in 3D Space */}
      {hovered && (
        <Html distanceFactor={6} center>
          <div className="bg-slate-900/95 text-white px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xl backdrop-blur-md pointer-events-none whitespace-nowrap animate-fadeIn scale-95">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{dest.name}</span>
            </div>
            <div className="text-[9.5px] text-slate-300 font-medium mt-0.5">
              {dest.category} &bull; ★ {dest.rating}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Glowing Bezier Route Arcs between cities
function RouteArcs() {
  const lineObjects = useMemo(() => {
    const list: THREE.Line[] = [];
    for (let i = 0; i < DESTINATIONS.length - 1; i++) {
      const p1 = new THREE.Vector3(...DESTINATIONS[i].position);
      const p2 = new THREE.Vector3(...DESTINATIONS[i + 1].position);
      const mid = p1.clone().add(p2).multiplyScalar(0.5);
      // Lift the arc outward from globe
      mid.normalize().multiplyScalar(2.6);
      const curve = new THREE.CatmullRomCurve3([p1, mid, p2]);
      const points = curve.getPoints(32);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: "#A7F3D0",
        transparent: true,
        opacity: 0.45,
      });
      list.push(new THREE.Line(geometry, material));
    }
    return list;
  }, []);

  return (
    <group>
      {lineObjects.map((lineObj, idx) => (
        <primitive key={idx} object={lineObj} />
      ))}
    </group>
  );
}

// Gentle Floating Particles (Local Discovery vibe)
function AtmosphereParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const count = 120;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i] = (Math.random() - 0.5) * 8;
      pos[i + 1] = (Math.random() - 0.5) * 6;
      pos[i + 2] = (Math.random() - 0.5) * 6;
    }
    return [pos];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.03;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#34D399"
        transparent
        opacity={0.55}
        sizeAttenuation
      />
    </points>
  );
}

// 2D Elegant Fallback when WebGL is unavailable
function WebGLFallback2D() {
  return (
    <div className="w-full h-full min-h-[380px] flex items-center justify-center relative p-6">
      <div className="w-full max-w-[420px] bg-white/90 backdrop-blur-md rounded-3xl p-6 border border-emerald-100 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mx-auto border border-emerald-200">
          <Navigation className="w-7 h-7 stroke-[2.2] animate-bounce-gentle" />
        </div>
        <div>
          <h3 className="font-extrabold text-[#0F172A] text-lg">
            LocalLens Interactive Travel Radar
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time local tours, adventure workshops, and curated cultural experiences across India.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-left pt-2">
          {DESTINATIONS.slice(0, 4).map((d) => (
            <div key={d.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <div className="font-bold text-[#0F172A]">{d.name}</div>
              <div className="text-[10px] text-[#059669] font-medium">{d.category}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero3DCanvas() {
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
    return <WebGLFallback2D />;
  }

  return (
    <ErrorBoundary fallback={<WebGLFallback2D />}>
      <div className="w-full h-[430px] sm:h-[480px] relative select-none">
        <Canvas
          camera={{ position: [0, 0.4, 5.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[4, 5, 3]} intensity={1.4} color="#E0F2FE" />
          <pointLight position={[-4, -3, -2]} intensity={0.6} color="#059669" />

          <Float speed={1.8} rotationIntensity={0.3} floatIntensity={0.5}>
            <TravelGlobe />
          </Float>

          <AtmosphereParticles />
        </Canvas>

        {/* Live Coordinate Overlay Chip */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-emerald-500/30 text-white text-[11px] font-mono flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>3D Travel Grid Active: 19.1311° N, 72.8154° E</span>
        </div>
      </div>
    </ErrorBoundary>
  );
}
export default Hero3DCanvas;
