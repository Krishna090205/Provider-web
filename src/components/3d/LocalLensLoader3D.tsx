"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sparkles } from "lucide-react";

function SpinningPinAndRing() {
  const pinGroupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (pinGroupRef.current) {
      pinGroupRef.current.rotation.y += delta * 2.2;
      const t = performance.now() * 0.003;
      pinGroupRef.current.position.y = Math.sin(t) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 1.5;
    }
  });

  return (
    <group>
      {/* Rotating Orbit Route Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 3, 0, 0]}>
        <ringGeometry args={[0.9, 0.98, 36]} />
        <meshBasicMaterial color="#34D399" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Floating 3D Pin */}
      <group ref={pinGroupRef}>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.02, 0.05, 0.35, 16]} />
          <meshStandardMaterial color="#059669" roughness={0.2} metalness={0.3} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#10B981" roughness={0.2} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </group>
  );
}

export const LocalLensLoader3D: React.FC<{ message?: string; className?: string }> = ({
  message = "Preparing your travel workspace...",
  className = "",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
      <div className="w-32 h-32 relative">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <SpinningPinAndRing />
        </Canvas>
      </div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-800 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
          <span>{message}</span>
        </div>
        <p className="text-[11px] text-slate-400 font-medium">LocalLens Provider Ecosystem</p>
      </div>
    </div>
  );
};
