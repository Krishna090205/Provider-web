"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TravelTerrainProps {
  baseHeight?: number;
  enableBreathing?: boolean;
}

export const TravelTerrain: React.FC<TravelTerrainProps> = ({
  baseHeight = -0.6,
  enableBreathing = true,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  // Generate smooth rolling landscape elevation using procedural trigonometric hills
  const terrainGeometry = useMemo(() => {
    const width = 6.5;
    const height = 6.5;
    const segments = 48;
    const geo = new THREE.PlaneGeometry(width, height, segments, segments);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle rolling hill formula
      const distFromCenter = Math.sqrt(x * x + y * y);
      const elevation =
        Math.sin(x * 0.9) * 0.32 +
        Math.cos(y * 0.8) * 0.28 +
        Math.sin(x * 1.8 + y * 1.5) * 0.12 -
        Math.pow(distFromCenter / 3.4, 2) * 0.4;

      pos.setZ(i, Math.max(-0.4, elevation));
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (groupRef.current && enableBreathing) {
      groupRef.current.position.y = baseHeight + Math.sin(t * 0.3) * 0.03;
      groupRef.current.rotation.z = Math.sin(t * 0.15) * 0.015;
    }
    if (waterRef.current) {
      // Subtle ocean shimmering
      waterRef.current.position.z = -0.15 + Math.sin(t * 0.6) * 0.015;
    }
  });

  return (
    <group ref={groupRef} position={[0, baseHeight, 0]} rotation={[-Math.PI / 2.8, 0, 0]}>
      {/* Ocean / Coastline Water Surface */}
      <mesh ref={waterRef} position={[0, 0, -0.15]}>
        <planeGeometry args={[8, 8, 16, 16]} />
        <meshStandardMaterial
          color="#0284C7"
          roughness={0.2}
          metalness={0.4}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* Emerald Coastal & Hill Terrain */}
      <mesh geometry={terrainGeometry} receiveShadow castShadow>
        <meshStandardMaterial
          color="#059669"
          roughness={0.7}
          metalness={0.15}
          flatShading={false}
        />
      </mesh>

      {/* Gentle Shoreline Foam Rim */}
      <mesh position={[0, 0, -0.12]}>
        <ringGeometry args={[2.8, 3.2, 32]} />
        <meshBasicMaterial color="#A7F3D0" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};
