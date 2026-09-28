"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LocalLensSceneProps {
  children: React.ReactNode;
  className?: string;
  cameraPosition?: [number, number, number];
  fov?: number;
  enableParallax?: boolean;
  fallback?: React.ReactNode;
  height?: string;
}

// Camera controller with damped mouse parallax
function CameraRig({
  defaultPos = [0, 1.5, 6],
  enableParallax = true,
}: {
  defaultPos?: [number, number, number];
  enableParallax?: boolean;
}) {
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enableParallax) return;
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to [-1, 1]
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [enableParallax]);

  useFrame((state, delta) => {
    if (!enableParallax) return;
    // Damped interpolation towards target camera position
    const targetX = defaultPos[0] + mouse.current.x * 0.4;
    const targetY = defaultPos[1] + mouse.current.y * 0.3;
    const targetZ = defaultPos[2];

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, targetX, 2.5, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, targetY, 2.5, delta);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, targetZ, 2.5, delta);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

export const LocalLensScene: React.FC<LocalLensSceneProps> = ({
  children,
  className = "",
  cameraPosition = [0, 1.8, 6],
  fov = 45,
  enableParallax = true,
  fallback = null,
  height = "h-[440px]",
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-gradient-to-br from-emerald-50/80 to-slate-100 rounded-3xl border border-slate-200/80 shadow-xs p-6 ${className}`}>
        {fallback || (
          <div className="text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#059669] flex items-center justify-center font-black mx-auto">
              🌍
            </div>
            <p className="text-xs font-bold text-slate-800">LocalLens Interactive View</p>
            <p className="text-[11px] text-slate-500">Accelerated 2D Display Active</p>
          </div>
        )}
      </div>
    );
  }

  if (hasWebGL === null) {
    return (
      <div className={`w-full ${height} flex items-center justify-center bg-slate-50/50 rounded-3xl border border-slate-100 ${className}`}>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <span>Initializing 3D viewport...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${height} overflow-hidden rounded-3xl ${className}`}>
      <Canvas
        camera={{ position: cameraPosition, fov }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: true,
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 8, 5]} intensity={1.2} color="#FFFBF0" />
        <hemisphereLight args={["#E0F2FE", "#ECFDF5", 0.6]} />

        <CameraRig defaultPos={cameraPosition} enableParallax={enableParallax} />

        <Suspense fallback={null}>
          {children}
        </Suspense>
      </Canvas>
    </div>
  );
};
