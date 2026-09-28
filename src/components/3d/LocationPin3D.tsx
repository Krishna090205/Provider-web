"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LocationPin3DProps {
  position?: [number, number, number];
  color?: string;
  glowColor?: string;
  label?: string;
  sublabel?: string;
  onClick?: () => void;
  scale?: number;
  animateDrop?: boolean;
}

export const LocationPin3D: React.FC<LocationPin3DProps> = ({
  position = [0, 0, 0],
  color = "#059669",
  glowColor = "#34D399",
  label,
  sublabel,
  onClick,
  scale = 1,
  animateDrop = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Drop animation progress (0 -> 1)
  const dropProgress = useRef(animateDrop ? 0 : 1);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (dropProgress.current < 1) {
      dropProgress.current = Math.min(1, dropProgress.current + delta * 3.5);
      // Spring bounce curve
      const p = dropProgress.current;
      const bounce = Math.sin(p * Math.PI) * (1 - p) * 0.4;
      const currentY = position[1] + (1 - p) * 2 + bounce;
      groupRef.current.position.y = currentY;
    } else {
      // Gentle floating bob
      const t = performance.now() * 0.002;
      groupRef.current.position.y = position[1] + Math.sin(t) * 0.04 + (hovered ? 0.08 : 0);
    }

    // Expanding pulse ring
    if (pulseRef.current) {
      const pTime = (performance.now() * 0.0015) % 1;
      pulseRef.current.scale.set(1 + pTime * 1.5, 1 + pTime * 1.5, 1);
      const mat = pulseRef.current.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = Math.max(0, (1 - pTime) * 0.4);
    }
  });

  const targetScale = scale * (hovered ? 1.25 : 1);

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1], position[2]]}
      scale={[targetScale, targetScale, targetScale]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Ground Pulse Disc */}
      <mesh
        ref={pulseRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <ringGeometry args={[0.08, 0.18, 24]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.4} />
      </mesh>

      {/* Pin Stem */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.015, 0.03, 0.35, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Pin Head Sphere */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial
          color={hovered ? "#10B981" : color}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Glowing Inner Core */}
      <mesh position={[0, 0.42, 0]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};
