"use client";

import React, { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Star, MapPin } from "lucide-react";

interface FloatingExperienceCardProps {
  position?: [number, number, number];
  title: string;
  location: string;
  price: string;
  rating?: number | null;
  image?: string;
  onClick?: () => void;
}

export const FloatingExperienceCard: React.FC<FloatingExperienceCardProps> = ({
  position = [1.2, 0.4, 0],
  title,
  location,
  price,
  rating = 4.9,
  image,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Gentle vertical bobbing & tiny tilt
    const bob = Math.sin(t * 1.2) * 0.04;
    const tilt = Math.cos(t * 0.9) * 0.02;

    groupRef.current.position.y = position[1] + bob;
    groupRef.current.rotation.z = tilt;

    // Smooth hover depth shift towards camera
    const targetZ = position[2] + (hovered ? 0.35 : 0);
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      0.1
    );
  });

  return (
    <group ref={groupRef} position={position}>
      <Html
        transform
        distanceFactor={4.5}
        position={[0, 0, 0]}
        style={{
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: hovered ? "scale(1.06)" : "scale(1)",
        }}
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={onClick}
          className={`w-64 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl cursor-pointer select-none transition-all ${
            hovered ? "border-emerald-500 shadow-2xl ring-2 ring-emerald-500/20" : ""
          }`}
        >
          {image && (
            <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2.5 bg-slate-100">
              <img
                src={image}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/90 text-emerald-800 backdrop-blur-xs flex items-center gap-0.5 shadow-xs">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                {rating || "4.9"}
              </span>
            </div>
          )}
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-900 line-clamp-1 leading-snug">
              {title}
            </h4>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-600" />
                {location}
              </span>
              <span className="font-extrabold text-emerald-700">{price}</span>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
};
