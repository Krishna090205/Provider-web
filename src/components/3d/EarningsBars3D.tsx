"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LocalLensScene } from "./LocalLensScene";

export interface MetricBarItem {
  label: string;
  value: number;
  displayValue: string;
  color?: string;
}

interface EarningsBars3DProps {
  metrics?: MetricBarItem[];
  className?: string;
}

const DEFAULT_METRICS: MetricBarItem[] = [
  { label: "Earnings (₹k)", value: 48, displayValue: "₹48.2k", color: "#059669" },
  { label: "Bookings", value: 34, displayValue: "34", color: "#10B981" },
  { label: "Guest Reach", value: 65, displayValue: "650+", color: "#34D399" },
  { label: "Rating (x10)", value: 49, displayValue: "4.9 ★", color: "#F59E0B" },
];

function BarMesh({
  item,
  xPos,
  targetHeight,
}: {
  item: MetricBarItem;
  xPos: number;
  targetHeight: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentHeight = useRef(0.1);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (currentHeight.current < targetHeight) {
      currentHeight.current = Math.min(targetHeight, currentHeight.current + delta * 2.5);
      meshRef.current.scale.y = currentHeight.current;
      meshRef.current.position.y = -0.8 + currentHeight.current * 0.5;
    }
  });

  return (
    <group position={[xPos, 0, 0]}>
      {/* Cylindrical 3D Bar */}
      <mesh
        ref={meshRef}
        position={[0, -0.8 + 0.05, 0]}
        scale={[1, 0.1, 1]}
      >
        <cylinderGeometry args={[0.2, 0.2, 1, 32]} />
        <meshStandardMaterial
          color={item.color || "#059669"}
          roughness={0.25}
          metalness={0.3}
        />
      </mesh>

      {/* Metric Label and Value in HTML */}
      <Html
        distanceFactor={4.5}
        position={[0, -0.8 + targetHeight + 0.35, 0]}
        style={{ pointerEvents: "none", transform: "translate(-50%, -50%)" }}
      >
        <div className="text-center select-none whitespace-nowrap">
          <div className="text-xs font-black text-slate-900 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full border border-slate-200/80 shadow-xs">
            {item.displayValue}
          </div>
          <div className="text-[10px] font-bold text-slate-500 mt-1">
            {item.label}
          </div>
        </div>
      </Html>
    </group>
  );
}

export const EarningsBars3D: React.FC<EarningsBars3DProps> = ({
  metrics = DEFAULT_METRICS,
  className = "",
}) => {
  const maxVal = Math.max(...metrics.map((m) => m.value), 1);
  const xPositions = [-1.5, -0.5, 0.5, 1.5];

  return (
    <div className={`w-full h-full min-h-[260px] ${className}`}>
      <LocalLensScene
        cameraPosition={[0, 0.3, 4.2]}
        fov={45}
        enableParallax={true}
        height="h-[260px]"
        fallback={
          <div className="grid grid-cols-2 gap-3 p-4">
            {metrics.map((m, idx) => (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                <div className="text-sm font-black text-emerald-700">{m.displayValue}</div>
                <div className="text-[11px] text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        }
      >
        {/* Subtle Base Ground Grid */}
        <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 2.5]} />
          <meshBasicMaterial color="#E2E8F0" transparent opacity={0.3} />
        </mesh>

        {metrics.map((m, idx) => {
          const normHeight = 0.5 + (m.value / maxVal) * 1.5;
          return (
            <BarMesh
              key={idx}
              item={m}
              xPos={xPositions[idx] || 0}
              targetHeight={normHeight}
            />
          );
        })}
      </LocalLensScene>
    </div>
  );
};
