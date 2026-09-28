"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LocalLensScene } from "./LocalLensScene";

function AmbientRoutes() {
  const routes = useMemo(() => {
    const list: THREE.Line[] = [];
    const pointsList = [
      [[-2.5, -1, -1], [-0.5, 0.8, -0.5], [1.8, -0.4, -0.8]],
      [[-1.8, 1.2, -1.2], [0.8, -0.6, -0.6], [2.6, 1.0, -1.4]],
    ];
    for (const pts of pointsList) {
      const vPts = pts.map((p) => new THREE.Vector3(...p));
      const curve = new THREE.CatmullRomCurve3(vPts);
      const geom = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
      const mat = new THREE.LineBasicMaterial({
        color: "#10B981",
        transparent: true,
        opacity: 0.22,
      });
      list.push(new THREE.Line(geom, mat));
    }
    return list;
  }, []);

  return (
    <group>
      {routes.map((line, idx) => (
        <primitive key={idx} object={line} />
      ))}
    </group>
  );
}

function FloatingGlobeWire() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[2.2, -0.5, -1.5]}>
      <sphereGeometry args={[1.8, 20, 20]} />
      <meshBasicMaterial
        color="#34D399"
        wireframe
        transparent
        opacity={0.12}
      />
    </mesh>
  );
}

export const Login3DBackground: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <LocalLensScene
        cameraPosition={[0, 0, 4.5]}
        fov={50}
        enableParallax={true}
        height="h-full"
        fallback={<div className="w-full h-full bg-slate-900" />}
      >
        <AmbientRoutes />
        <FloatingGlobeWire />

        {/* Floating Destination Pings */}
        {[
          [-1.5, 0.8, -0.8],
          [0.4, -1.1, -0.5],
          [1.5, 1.2, -1.0],
        ].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#A7F3D0" transparent opacity={0.6} />
          </mesh>
        ))}
      </LocalLensScene>
    </div>
  );
};
