"use client";

import React from "react";
import { LocationPin3D } from "./LocationPin3D";

export interface ExperienceMarkerItem {
  id: string;
  name: string;
  location?: string;
  city?: string;
  price?: string | number;
  rating?: number | null;
  position: [number, number, number];
}

interface ExperienceMarkersProps {
  experiences: ExperienceMarkerItem[];
  selectedId?: string | null;
  onSelect?: (exp: ExperienceMarkerItem) => void;
}

export const ExperienceMarkers: React.FC<ExperienceMarkersProps> = ({
  experiences,
  selectedId,
  onSelect,
}) => {
  return (
    <group>
      {experiences.map((exp) => {
        const isSelected = selectedId === exp.id;
        return (
          <LocationPin3D
            key={exp.id}
            position={exp.position}
            label={exp.name}
            sublabel={exp.city}
            color={isSelected ? "#059669" : "#10B981"}
            glowColor={isSelected ? "#6EE7B7" : "#34D399"}
            scale={isSelected ? 1.3 : 1}
            onClick={() => onSelect?.(exp)}
          />
        );
      })}
    </group>
  );
};
