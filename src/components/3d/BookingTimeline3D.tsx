"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { LocalLensScene } from "./LocalLensScene";
import { Clock, CheckCircle2, UserCheck, Calendar } from "lucide-react";

export interface BookingActivityItem {
  id: string;
  time: string;
  title: string;
  guestName?: string;
  status: "Confirmed" | "Completed" | "Pending";
  pax?: number;
}

interface BookingTimeline3DProps {
  bookings?: BookingActivityItem[];
  className?: string;
}

const DEFAULT_SCHEDULE: BookingActivityItem[] = [
  { id: "b1", time: "08:30 AM", title: "Sunset Kayaking at Versova", guestName: "Rahul Sharma", status: "Confirmed", pax: 2 },
  { id: "b2", time: "11:00 AM", title: "Heritage Architecture Walk", guestName: "Sarah Jenkins", status: "Confirmed", pax: 4 },
  { id: "b3", time: "03:30 PM", title: "Clay Pottery Masterclass", guestName: "Pooja Patel", status: "Confirmed", pax: 1 },
  { id: "b4", time: "05:45 PM", title: "Coastal Sunset Photography", guestName: "David Miller", status: "Pending", pax: 3 },
];

function TimelineSpine() {
  const lineObj = React.useMemo(() => {
    const points = [
      new THREE.Vector3(-1.8, 1.2, 0),
      new THREE.Vector3(-0.6, 0.4, 0.2),
      new THREE.Vector3(0.6, -0.4, 0.2),
      new THREE.Vector3(1.8, -1.2, 0),
    ];
    const curve = new THREE.CatmullRomCurve3(points);
    const pts = curve.getPoints(50);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: "#10B981",
      transparent: true,
      opacity: 0.4,
    });
    return new THREE.Line(geo, mat);
  }, []);

  return <primitive object={lineObj} />;
}

function ActivityNode({
  item,
  position,
  index,
}: {
  item: BookingActivityItem;
  position: [number, number, number];
  index: number;
}) {
  const nodeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!nodeRef.current) return;
    const t = clock.getElapsedTime() + index * 0.7;
    nodeRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.03;
  });

  return (
    <group ref={nodeRef} position={position}>
      {/* Node Sphere */}
      <mesh>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={item.status === "Confirmed" ? "#059669" : "#D97706"}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      {/* Glow Halo */}
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial
          color={item.status === "Confirmed" ? "#A7F3D0" : "#FDE68A"}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* HTML Card floating beside the 3D Node */}
      <Html
        distanceFactor={4.8}
        position={[0.22, 0, 0]}
        style={{ pointerEvents: "none", width: "190px" }}
      >
        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200/90 shadow-md space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-emerald-700 font-extrabold">
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {item.time}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                item.status === "Confirmed"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {item.status}
            </span>
          </div>
          <div className="text-[11px] font-black text-slate-900 truncate">
            {item.title}
          </div>
          {item.guestName && (
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <UserCheck className="w-2.5 h-2.5 text-slate-400" />
              <span>{item.guestName}</span>
              {item.pax && <span>&bull; {item.pax} Guests</span>}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

export const BookingTimeline3D: React.FC<BookingTimeline3DProps> = ({
  bookings = DEFAULT_SCHEDULE,
  className = "",
}) => {
  const displayItems = bookings.length > 0 ? bookings.slice(0, 4) : DEFAULT_SCHEDULE;

  const positions: [number, number, number][] = [
    [-1.8, 1.0, 0],
    [-0.6, 0.35, 0.2],
    [0.6, -0.35, 0.2],
    [1.8, -1.0, 0],
  ];

  return (
    <div className={`w-full h-full min-h-[320px] ${className}`}>
      <LocalLensScene
        cameraPosition={[0, 0, 4.4]}
        fov={45}
        enableParallax={true}
        height="h-[320px]"
        fallback={
          <div className="p-4 space-y-2.5">
            {displayItems.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-slate-800">{b.title}</div>
                  <div className="text-[10px] text-slate-500">{b.time} &bull; {b.guestName}</div>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        }
      >
        <TimelineSpine />
        {displayItems.map((item, idx) => (
          <ActivityNode
            key={item.id}
            item={item}
            position={positions[idx] || [0, 0, 0]}
            index={idx}
          />
        ))}
      </LocalLensScene>
    </div>
  );
};
