"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LocalLensScene } from "./LocalLensScene";
import { User, Sparkles, Building2, Compass } from "lucide-react";

interface NodeData {
  title: string;
  label: string;
  pos: [number, number, number];
  color: string;
  icon: string;
}

const FLOW_NODES: NodeData[] = [
  { title: "Traveler", label: "Discovery Query", pos: [-2.1, 0, 0], color: "#38BDF8", icon: "user" },
  { title: "LocalLens AI", label: "Semantic Match", pos: [-0.7, 0.35, 0], color: "#10B981", icon: "sparkles" },
  { title: "Provider", label: "Instant Booking", pos: [0.7, -0.35, 0], color: "#059669", icon: "provider" },
  { title: "Experience", label: "Live Doorstep Drop", pos: [2.1, 0, 0], color: "#F59E0B", icon: "experience" },
];

function ConnectingFlowCurve() {
  const lineObj = useMemo(() => {
    const points = FLOW_NODES.map((n) => new THREE.Vector3(...n.pos));
    const curve = new THREE.CatmullRomCurve3(points);
    const pts = curve.getPoints(50);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: "#34D399",
      transparent: true,
      opacity: 0.45,
    });
    return { line: new THREE.Line(geo, mat), curve };
  }, []);

  const packetRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!packetRef.current) return;
    const progress = (clock.getElapsedTime() * 0.45) % 1;
    const pos = lineObj.curve.getPointAt(progress);
    packetRef.current.position.copy(pos);
  });

  return (
    <group>
      <primitive object={lineObj.line} />
      <mesh ref={packetRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#FDE047" />
      </mesh>
    </group>
  );
}

export const AIMatchingFlow3D: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`w-full h-[260px] ${className}`}>
      <LocalLensScene
        cameraPosition={[0, 0, 4.2]}
        fov={45}
        enableParallax={true}
        height="h-[260px]"
        fallback={
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            {FLOW_NODES.map((n, i) => (
              <div key={i} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100 flex-1">
                <div className="text-xs font-black text-slate-800">{n.title}</div>
                <div className="text-[10px] text-emerald-600 font-bold">{n.label}</div>
              </div>
            ))}
          </div>
        }
      >
        <ConnectingFlowCurve />

        {FLOW_NODES.map((node, idx) => (
          <group key={idx} position={node.pos}>
            <mesh>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial
                color={node.color}
                roughness={0.2}
                metalness={0.3}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshBasicMaterial color={node.color} transparent opacity={0.25} />
            </mesh>

            <Html distanceFactor={4.5} position={[0, -0.32, 0]} center>
              <div className="text-center select-none whitespace-nowrap bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl border border-slate-200 shadow-sm pointer-events-none">
                <div className="text-[11px] font-black text-slate-900 leading-tight">
                  {node.title}
                </div>
                <div className="text-[9.5px] font-bold text-emerald-700">
                  {node.label}
                </div>
              </div>
            </Html>
          </group>
        ))}
      </LocalLensScene>
    </div>
  );
};
