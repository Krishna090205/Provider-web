"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Compass,
  AlertCircle,
  RefreshCw,
  Layers,
  CheckCircle2,
  Info,
} from "lucide-react";

// Dynamically load the Leaflet OpenStreetMap fallback without SSR
const LeafletPinDropper = dynamic(
  () =>
    import("@/components/map/LeafletPinDropper").then(
      (mod) => mod.LeafletPinDropper
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-400 font-bold">
        Loading Interactive Map...
      </div>
    ),
  }
);

interface GoogleMapPinDropperProps {
  position: { lat: number; lng: number };
  onPinSelected: (coords: { lat: number; lng: number; address?: string; city?: string; district?: string; state?: string }) => void;
  venueName?: string;
  zoom?: number;
}

declare global {
  interface Window {
    google?: any;
    gm_authFailure?: () => void;
  }
}

export const GoogleMapPinDropper: React.FC<GoogleMapPinDropperProps> = ({
  position,
  onPinSelected,
  venueName = "Selected Venue",
  zoom = 14,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [activeProvider, setActiveProvider] = useState<"google" | "osm">("google");
  const [googleStatus, setGoogleStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const [authErrorReason, setAuthErrorReason] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA7pXqfj071eC94R8h_h8yGuvhYGEdNcpg";

  const onPinSelectedRef = useRef(onPinSelected);
  useEffect(() => {
    onPinSelectedRef.current = onPinSelected;
  }, [onPinSelected]);

  const venueNameRef = useRef(venueName);
  useEffect(() => {
    venueNameRef.current = venueName;
  }, [venueName]);

  // Gracefully handle Google Maps Auth Failure without breaking the page or triggering dev overlay
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalGmAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      console.warn(
        "[LocalLens] Google Maps Authentication Notice: Maps JavaScript API is unactivated or restricted. Seamlessly switching to OpenStreetMap."
      );
      setGoogleStatus("failed");
      setAuthErrorReason("Google Maps API requires activation. OpenStreetMap active.");
      setActiveProvider("osm");
      if (typeof originalGmAuthFailure === "function") {
        try {
          originalGmAuthFailure();
        } catch {
          // suppress uncaught throw
        }
      }
    };

    return () => {
      window.gm_authFailure = originalGmAuthFailure;
    };
  }, []);

  // Initialize Google Maps instance
  const initGoogleMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || activeProvider !== "google") return;

    try {
      const center = { lat: position.lat, lng: position.lng };

      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(center);
        if (markerRef.current) {
          markerRef.current.setPosition(center);
        }
        setGoogleStatus("ready");
        return;
      }

      const mapOptions = {
        center,
        zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle?.HORIZONTAL_BAR,
          position: window.google.maps.ControlPosition?.TOP_RIGHT,
        },
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: "cooperative",
      };

      const map = new window.google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        title: venueNameRef.current,
        draggable: true,
        animation: window.google.maps.Animation?.DROP,
      });
      markerRef.current = marker;

      marker.addListener("dragend", (e: any) => {
        const lat = Number(e.latLng.lat().toFixed(6));
        const lng = Number(e.latLng.lng().toFixed(6));
        onPinSelectedRef.current({ lat, lng });
      });

      map.addListener("click", (e: any) => {
        const lat = Number(e.latLng.lat().toFixed(6));
        const lng = Number(e.latLng.lng().toFixed(6));
        marker.setPosition(e.latLng);
        map.panTo(e.latLng);
        onPinSelectedRef.current({ lat, lng });
      });

      setGoogleStatus("ready");
    } catch (err: any) {
      console.warn("[LocalLens] Google Maps init notice:", err);
      setGoogleStatus("failed");
      setActiveProvider("osm");
    }
  }, [position.lat, position.lng, zoom, activeProvider]);

  // Smoothly pan and reposition marker when position coordinates update (e.g. from place search)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newCenter = { lat: position.lat, lng: position.lng };
      markerRef.current.setPosition(newCenter);
      mapInstanceRef.current.panTo(newCenter);
    }
  }, [position.lat, position.lng]);

  // Load Google Maps SDK
  useEffect(() => {
    if (activeProvider !== "google") return;

    if (window.google?.maps) {
      initGoogleMap();
      return;
    }

    setGoogleStatus("loading");
    const scriptId = "google-maps-script";
    const existing = (document.getElementById(scriptId) ||
      document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) as HTMLScriptElement | null;

    if (existing) {
      if (window.google?.maps) {
        initGoogleMap();
      } else {
        existing.addEventListener("load", () => initGoogleMap());
      }
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setTimeout(() => {
        if (googleStatus !== "failed") {
          initGoogleMap();
        }
      }, 150);
    };

    script.onerror = () => {
      setGoogleStatus("failed");
      setActiveProvider("osm");
    };

    document.head.appendChild(script);
  }, [activeProvider, apiKey, googleStatus, initGoogleMap]);

  // "Use My Location" Geolocation button
  const handleUseMyLocation = () => {
    setLocatingError(null);
    if (!navigator.geolocation) {
      setLocatingError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onPinSelected({ lat, lng });
      },
      (err) => {
        setIsLocating(false);
        setLocatingError(err.message || "Could not detect location. Please select on map.");
        setTimeout(() => setLocatingError(null), 4000);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Quick preset destinations for instant pin setting
  const presets = [
    { name: "Versova Beach", lat: 19.131102, lng: 72.81541 },
    { name: "Colaba Causeway", lat: 18.922, lng: 72.8347 },
    { name: "Bandra Bandstand", lat: 19.0494, lng: 72.8197 },
    { name: "Juhu Beach", lat: 19.0988, lng: 72.8264 },
  ];

  return (
    <div className="space-y-2">
      {/* Map Control Header: Mode Switcher & Use My Location */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveProvider("osm")}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              activeProvider === "osm"
                ? "bg-white text-[#0e8a5b] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Interactive Map (OSM)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveProvider("google");
              if (googleStatus === "failed") {
                setGoogleStatus("idle");
              }
            }}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
              activeProvider === "google"
                ? "bg-white text-[#0e8a5b] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Google Maps
          </button>
        </div>

        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-[11px] font-bold shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 text-[#0e8a5b] ${isLocating ? "animate-spin" : ""}`} />
          <span>{isLocating ? "Detecting GPS..." : "Use My Location"}</span>
        </button>
      </div>

      {locatingError && (
        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{locatingError}</span>
        </div>
      )}

      {/* Map Surface */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner">
        {activeProvider === "osm" ? (
          <LeafletPinDropper
            position={position}
            onPinSelected={onPinSelected}
            venueName={venueName}
          />
        ) : (
          <div className="w-full h-full relative">
            <div ref={mapRef} className="w-full h-full" />
            {googleStatus === "loading" && (
              <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center gap-2 z-10">
                <div className="w-7 h-7 rounded-full border-3 border-[#0e8a5b] border-t-transparent animate-spin" />
                <span className="text-xs font-bold text-slate-500">Connecting to Google Maps...</span>
              </div>
            )}
            {googleStatus === "failed" && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10 space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mb-1" />
                <h4 className="text-xs font-bold text-slate-800">Google Maps Notice</h4>
                <p className="text-[11px] text-slate-600 max-w-sm">
                  {authErrorReason || "Google Maps API key is not activated on this project."}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveProvider("osm")}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-[#0e8a5b] text-white text-xs font-bold hover:bg-[#0b744d] cursor-pointer"
                >
                  Switch to Interactive OpenStreetMap
                </button>
              </div>
            )}

            {/* Bottom Coordinates Chip */}
            <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-900/85 text-white text-[10.5px] font-mono px-2.5 py-1 rounded-lg backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
              {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
            </div>

            {/* Bottom Right Mode Badge */}
            <div className="absolute bottom-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-md border border-slate-200/80 flex items-center gap-1.5 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#0e8a5b] animate-pulse" />
              <span className="text-[10.5px] font-extrabold text-slate-800 tracking-tight">
                Google Maps
              </span>
              <span className="text-[10px] text-slate-400 font-medium">|</span>
              <span className="text-[10px] text-[#0e8a5b] font-bold">
                Drag Pin to Adjust
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick location presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1">
          Quick Spots:
        </span>
        {presets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => onPinSelected({ lat: preset.lat, lng: preset.lng })}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-semibold border transition-all cursor-pointer ${
              Math.abs(position.lat - preset.lat) < 0.005 &&
              Math.abs(position.lng - preset.lng) < 0.005
                ? "bg-emerald-50 text-[#0e8a5b] border-emerald-300 font-bold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
};