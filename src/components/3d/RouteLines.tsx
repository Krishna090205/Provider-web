"use client";

import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface RouteData {
  start: [number, number, number];
  end: [number, number, number];
  heightOffset?: number;
  color?: string;
  speed?: number;
}

interface RouteLinesProps {
  routes?: RouteData[];
}

function SingleRoute({
  route,
  index,
}: {
  route: RouteData;
  index: number;
}) {
  const beadRef = useRef<THREE.Mesh>(null);

  const { curve, lineObject } = useMemo(() => {
    const p1 = new THREE.Vector3(...route.start);
    const p2 = new THREE.Vector3(...route.end);
    const mid = p1.clone().add(p2).multiplyScalar(0.5);
    const height = route.heightOffset ?? 0.8;
    mid.y += height;

    const crCurve = new THREE.CatmullRomCurve3([p1, mid, p2]);
    const points = crCurve.getPoints(40);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: route.color || "#A7F3D0",
      transparent: true,
      opacity: 0.35,
    });
    const line = new THREE.Line(geometry, material);
    return { curve: crCurve, lineObject: line };
  }, [route]);

  useFrame(({ clock }) => {
    if (!beadRef.current) return;
    const speed = route.speed || 0.35;
    // Stagger phase with index
    const progress = (clock.getElapsedTime() * speed + index * 0.3) % 1;
    const pos = curve.getPointAt(progress);
    beadRef.current.position.copy(pos);
  });

  return (
    <group>
      <primitive object={lineObject} />
      {/* Glowing Traveler Bead traversing the route */}
      <mesh ref={beadRef}>
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshBasicMaterial color="#FDE047" />
      </mesh>
    </group>
  );
}

export const RouteLines: React.FC<RouteLinesProps> = ({ routes = [] }) => {
  return (
    <group>
      {routes.map((route, idx) => (
        <SingleRoute key={idx} route={route} index={idx} />
      ))}
    </group>
  );
};
