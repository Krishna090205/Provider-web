"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TravelGlobeProps {
  radius?: number;
  rotationSpeed?: number;
  color?: string;
  wireframeColor?: string;
}

export const TravelGlobe: React.FC<TravelGlobeProps> = ({
  radius = 2.1,
  rotationSpeed = 0.08,
  color = "#064E3B",
  wireframeColor = "#34D399",
}) => {
  const globeRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Deep Emerald Core Sphere */}
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshStandardMaterial
          color={color}
          roughness={0.8}
          metalness={0.15}
        />
      </mesh>

      {/* Subtle Coordinate Latitude / Longitude Rings */}
      <mesh>
        <sphereGeometry args={[radius * 1.008, 24, 24]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Atmospheric Soft Outer Glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.06, 32, 32]} />
        <meshBasicMaterial
          color="#A7F3D0"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
