"use client";

import React, { useEffect, useRef, useState } from "react";
import { Store, Navigation } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExperienceItem {
  id: string;
  name: string;
  category?: string;
  city?: string;
  price?: string | number;
  rating?: number;
  lat?: number;
  lng?: number;
}

interface Dashboard3DGlobeProps {
  experiences?: ExperienceItem[];
  totalGuests?: number;
  activeCount?: number;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyA7pXqfj071eC94R8h_h8yGuvhYGEdNcpg";

// ─── City coordinate fallbacks ────────────────────────────────────────────────

const CITY_COORDS: Record<string, [number, number]> = {
  mumbai:    [19.076, 72.877],
  delhi:     [28.613, 77.209],
  bangalore: [12.972, 77.594],
  bengaluru: [12.972, 77.594],
  chennai:   [13.082, 80.270],
  kolkata:   [22.572, 88.363],
  hyderabad: [17.385, 78.487],
  pune:      [18.520, 73.856],
  jaipur:    [26.912, 75.787],
  goa:       [15.499, 73.824],
  ahmedabad: [23.022, 72.571],
  surat:     [21.170, 72.831],
  lucknow:   [26.846, 80.946],
  varanasi:  [25.317, 82.973],
  agra:      [27.177, 78.008],
  kochi:     [9.9312, 76.266],
  mysore:    [12.295, 76.639],
  mysuru:    [12.295, 76.639],
  chandigarh:[30.733, 76.779],
  indore:    [22.719, 75.857],
  bhopal:    [23.259, 77.413],
  default:   [20.593, 78.963],
};

function getCityCoords(city?: string): [number, number] {
  if (!city) return CITY_COORDS.default;
  const key = city.toLowerCase().replace(/\s+/g, "");
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (k !== "default" && (key.includes(k) || k.includes(key))) return v;
  }
  return CITY_COORDS.default;
}

// ─── 3D Shop Marker SVG ───────────────────────────────────────────────────────

function make3DShopMarkerHTML(name: string, city: string, active: boolean): string {
  const accent = active ? "#FBBF24" : "#10B981";
  const glow = active ? "rgba(251,191,36,0.5)" : "rgba(16,185,129,0.5)";
  const roof = active ? "#F59E0B" : "#059669";
  const wall = active ? "#92400E" : "#064E3B";
  const dark = active ? "#78350F" : "#042F2C";

  return `
  <div style="
    display:flex;
    flex-direction:column;
    align-items:center;
    cursor:pointer;
    user-select:none;
    filter: drop-shadow(0 6px 20px ${glow});
    transition: transform 0.2s ease;
  " onmouseenter="this.style.transform='scale(1.15)'" onmouseleave="this.style.transform='scale(1)'">

    <!-- 3D Isometric Shop Building -->
    <svg width="52" height="60" viewBox="0 0 52 60" xmlns="http://www.w3.org/2000/svg">
      <!-- Shadow ellipse -->
      <ellipse cx="26" cy="57" rx="14" ry="4" fill="rgba(0,0,0,0.35)"/>

      <!-- Building LEFT face (dark side) -->
      <polygon points="8,44 8,22 26,30 26,52" fill="${dark}"/>

      <!-- Building RIGHT face -->
      <polygon points="44,44 44,22 26,30 26,52" fill="${wall}"/>

      <!-- Building ROOF (top face) -->
      <polygon points="8,22 26,14 44,22 26,30" fill="${roof}"/>

      <!-- Roof ridge highlight -->
      <polygon points="8,22 26,14 44,22 26,30" fill="none" stroke="${accent}" stroke-width="0.8" opacity="0.7"/>

      <!-- Roof peak / pointed top -->
      <polygon points="18,22 26,8 34,22 26,26" fill="${accent}" opacity="0.9"/>
      <polygon points="18,22 26,8 34,22 26,26" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.4"/>

      <!-- Door (front face) -->
      <rect x="21" y="42" width="10" height="10" rx="1" fill="${accent}" opacity="0.8"/>
      <rect x="21" y="42" width="10" height="10" rx="1" fill="none" stroke="#fff" stroke-width="0.5" opacity="0.5"/>

      <!-- Windows left face -->
      <rect x="11" y="28" width="6" height="5" rx="1" fill="${accent}" opacity="0.5"/>
      <rect x="11" y="36" width="6" height="5" rx="1" fill="${accent}" opacity="0.5"/>

      <!-- Windows right face -->
      <rect x="35" y="28" width="6" height="5" rx="1" fill="${accent}" opacity="0.5"/>
      <rect x="35" y="36" width="6" height="5" rx="1" fill="${accent}" opacity="0.5"/>

      <!-- Glowing sign board -->
      <rect x="14" y="20" width="24" height="7" rx="2" fill="${accent}" opacity="0.15"/>
      <text x="26" y="26" text-anchor="middle" font-size="4.5" font-weight="800"
        font-family="system-ui,sans-serif" fill="${accent}" opacity="0.9">SHOP</text>

      <!-- Pulsing ring at base -->
      <ellipse cx="26" cy="52" rx="10" ry="3" fill="none"
        stroke="${accent}" stroke-width="1" opacity="0.6">
        <animate attributeName="rx" values="8;14;8" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite"/>
      </ellipse>
    </svg>

    <!-- City label pill -->
    <div style="
      margin-top:2px;
      background: rgba(6,78,59,0.95);
      color: ${accent};
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 20px;
      border: 1px solid ${accent};
      white-space: nowrap;
      max-width: 90px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: monospace;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 8px ${glow};
    ">${city}</div>
  </div>`;
}

// ─── Google Maps Loader ───────────────────────────────────────────────────────

let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR not supported"));
  if (googleMapsLoadPromise) return googleMapsLoadPromise;
  if ((window as any).google?.maps?.importLibrary) {
    return (googleMapsLoadPromise = Promise.resolve());
  }

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Avoid creating duplicate script tags if one already exists
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) {
      if ((window as any).google?.maps) {
        resolve();
      } else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Google Maps script load error")));
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// ─── Main Map Component ───────────────────────────────────────────────────────

function GoogleIndiaMap({ experiences, totalGuests, activeCount }: Dashboard3DGlobeProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const gMapRef = useRef<any>(null);
  const lMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [engine, setEngine] = useState<"google" | "osm">("google");

  const pins = (experiences && experiences.length > 0 ? experiences : [
    { id: "1", name: "Versova Sunset Kayaking", city: "Mumbai",  category: "Adventure", price: 1200, rating: 4.9, lat: 19.1666, lng: 72.8020 },
    { id: "2", name: "Old Goa Heritage Walk",   city: "Goa",     category: "Heritage",  price: 850,  rating: 4.8, lat: 15.4989, lng: 73.8278 },
    { id: "3", name: "Pottery & Blue Art",       city: "Jaipur", category: "Art",       price: 1500, rating: 5.0, lat: 26.9124, lng: 75.7873 },
  ]).map((e) => ({
    ...e,
    lat: e.lat || getCityCoords(e.city)[0],
    lng: e.lng || getCityCoords(e.city)[1],
  }));

  // Helper to mount OpenStreetMap Leaflet map with 3D shop markers
  const mountLeafletMap = async () => {
    if (!mapRef.current) return;
    try {
      const L = (await import("leaflet")).default;

      if (lMapRef.current) {
        try { lMapRef.current.remove(); } catch {}
        lMapRef.current = null;
      }

      mapRef.current.innerHTML = "";

      const map = L.map(mapRef.current, {
        center: [22.5, 82.5],
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
      });
      lMapRef.current = map;

      // Dark Matter tile layer
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        subdomains: "abcd",
      }).addTo(map);

      // Add 3D Shop Markers
      pins.forEach((exp) => {
        const icon = L.divIcon({
          className: "leaflet-shop-3d-marker",
          html: make3DShopMarkerHTML(exp.name, exp.city || "", false),
          iconSize: [52, 68],
          iconAnchor: [26, 52],
          popupAnchor: [0, -50],
        });

        const marker = L.marker([exp.lat!, exp.lng!], { icon }).addTo(map);
        marker.bindPopup(buildPopup(exp), {
          closeButton: false,
          className: "custom-locallens-popup",
        });
      });

      setLoading(false);
    } catch (err) {
      console.warn("[LocalLens Map] Leaflet mount error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Gracefully catch Google Maps auth errors (e.g. ApiNotActivatedMapError) and switch to OSM
    const prevGmAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("[LocalLens Map] Google Maps API key unactivated/restricted. Switching to dark India map.");
      setEngine("osm");
      mountLeafletMap();
      if (typeof prevGmAuthFailure === "function") {
        try { prevGmAuthFailure(); } catch {}
      }
    };

    if (engine === "osm") {
      mountLeafletMap();
      return;
    }

    if (!mapRef.current) return;

    loadGoogleMaps()
      .then(async () => {
        const google = (window as any).google;
        if (!google?.maps) {
          setEngine("osm");
          mountLeafletMap();
          return;
        }

        // Dynamically load the 'maps' library to get Map and InfoWindow constructors
        let MapClass = google.maps.Map;
        let InfoWindowClass = google.maps.InfoWindow;
        if (typeof google.maps.importLibrary === "function") {
          try {
            const mapsLib = await google.maps.importLibrary("maps");
            if (mapsLib?.Map) MapClass = mapsLib.Map;
            if (mapsLib?.InfoWindow) InfoWindowClass = mapsLib.InfoWindow;
          } catch (e) {
            console.warn("[LocalLens Map] importLibrary('maps') notice:", e);
          }
        }

        if (!MapClass || typeof MapClass !== "function") {
          setEngine("osm");
          mountLeafletMap();
          return;
        }

        if (!mapRef.current) return;

        const map = new MapClass(mapRef.current, {
          center: { lat: 22.5, lng: 82.5 },
          zoom: 5,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          restriction: {
            latLngBounds: { north: 37, south: 6, east: 98, west: 68 },
            strictBounds: false,
          },
          styles: [
            { elementType: "geometry",           stylers: [{ color: "#0B1120" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#0B1120" }] },
            { elementType: "labels.text.fill",   stylers: [{ color: "#6B7280" }] },
            { featureType: "water",               elementType: "geometry", stylers: [{ color: "#0A1628" }] },
            { featureType: "road",                elementType: "geometry", stylers: [{ color: "#1E293B" }] },
            { featureType: "road",                elementType: "geometry.stroke", stylers: [{ color: "#0F172A" }] },
            { featureType: "administrative",      elementType: "geometry.stroke", stylers: [{ color: "#1E3A2F" }] },
            { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#10B981" }, { weight: 1.5 }] },
            { featureType: "administrative.province", elementType: "geometry.stroke", stylers: [{ color: "#064E3B" }, { weight: 0.8 }] },
            { featureType: "landscape",           elementType: "geometry", stylers: [{ color: "#0F1C14" }] },
            { featureType: "poi",                 stylers: [{ visibility: "off" }] },
            { featureType: "transit",             stylers: [{ visibility: "off" }] },
          ],
        });

        gMapRef.current = map;

        // Create shared InfoWindow
        if (InfoWindowClass) {
          infoWindowRef.current = new InfoWindowClass({
            disableAutoPan: false,
          });
        }

        // Add markers
        markersRef.current = pins.map((exp) => {
          const svgMarkerUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="#064E3B" stroke="#10B981" stroke-width="2.5"/>
              <text x="20" y="25" text-anchor="middle" font-size="18">🏪</text>
            </svg>
          `)}`;

          if (google.maps.Marker) {
            const marker = new google.maps.Marker({
              map,
              position: { lat: exp.lat!, lng: exp.lng! },
              title: exp.name,
              icon: {
                url: svgMarkerUrl,
                scaledSize: new google.maps.Size(36, 36),
                anchor: new google.maps.Point(18, 18),
              },
            });
            marker.addListener("click", () => {
              infoWindowRef.current?.setContent(buildPopup(exp));
              infoWindowRef.current?.open({ map, anchor: marker });
            });
            return marker;
          }
          return null;
        }).filter(Boolean);

        setLoading(false);
      })
      .catch((err) => {
        console.warn("[LocalLens Map] Google Maps script notice:", err);
        setEngine("osm");
        mountLeafletMap();
      });

    return () => {
      (window as any).gm_authFailure = prevGmAuthFailure;
      markersRef.current.forEach((m) => {
        try { m.map = null; } catch { /* */ }
        try { m.setMap(null); } catch { /* */ }
      });
      markersRef.current = [];
      if (infoWindowRef.current) {
        try { infoWindowRef.current.close(); } catch {}
        infoWindowRef.current = null;
      }
      if (gMapRef.current) {
        try {
          if ((window as any).google?.maps?.event?.clearInstanceListeners) {
            (window as any).google.maps.event.clearInstanceListeners(gMapRef.current);
          }
        } catch {}
        gMapRef.current = null;
      }
      if (lMapRef.current) {
        try { lMapRef.current.remove(); } catch {}
        lMapRef.current = null;
      }
    };
  }, [engine]);

  function buildPopup(exp: typeof pins[number]): string {
    return `
      <div style="
        background:#0F172A;color:white;border-radius:14px;
        padding:14px 16px;min-width:190px;max-width:230px;
        border:1px solid #10B981;font-family:system-ui,sans-serif;
        box-shadow:0 20px 60px rgba(0,0,0,0.9);
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:22px;">🏪</span>
          <div>
            <div style="font-size:11px;font-weight:800;color:#34D399;letter-spacing:0.05em;">${exp.city || "India"}</div>
            ${exp.category ? `<div style="font-size:9px;color:#94A3B8;">${exp.category}</div>` : ""}
          </div>
        </div>
        <div style="font-size:13px;font-weight:800;color:#fff;line-height:1.3;margin-bottom:8px;">
          ${exp.name}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          ${exp.price ? `<span style="background:#064E3B;color:#34D399;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;border:1px solid #059669;">₹${exp.price}</span>` : ""}
          ${exp.rating ? `<span style="background:#1C1917;color:#FBBF24;font-size:10px;font-weight:700;padding:3px 8px;border-radius:8px;">⭐ ${exp.rating}</span>` : ""}
        </div>
        <div style="font-size:9px;color:#475569;font-family:monospace;padding-top:6px;border-top:1px solid #1E293B;">
          📍 ${exp.lat!.toFixed(4)}°N, ${exp.lng!.toFixed(4)}°E
        </div>
      </div>`;
  }

  return (
    <div className="w-full h-[300px] sm:h-[320px] relative select-none rounded-2xl overflow-hidden border border-emerald-500/20 shadow-lg bg-[#0B1120]">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0B1120] z-10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <Navigation className="w-4 h-4 animate-spin" />
            Loading Google Maps…
          </div>
        </div>
      )}


      {/* Top badge */}
      {!loading && (
        <div className="absolute top-3 left-3 z-[999] flex items-center gap-2 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-extrabold text-emerald-300 font-mono tracking-tight bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
            🗺 Live Shop Map — India
          </span>
        </div>
      )}

      {/* Bottom stats */}
      {!loading && (
        <div className="absolute bottom-3 left-3 z-[999] flex items-center gap-2 pointer-events-none">
          <span className="text-[9.5px] font-bold text-emerald-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-emerald-500/20 backdrop-blur-sm">
            🏪 {pins.length} Shop{pins.length !== 1 ? "s" : ""}
          </span>
          {totalGuests !== undefined && (
            <span className="text-[9.5px] font-bold text-amber-300 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-amber-500/20 backdrop-blur-sm">
              👥 {totalGuests} Guests
            </span>
          )}
        </div>
      )}

      {/* Hint */}
      {!loading && (
        <div className="absolute bottom-3 right-3 z-[999] text-[9.5px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/10 backdrop-blur-sm pointer-events-none">
          Click 🏪 to inspect shop
        </div>
      )}

      {/* InfoWindow popup override styles */}
      <style>{`
        .gm-style .gm-style-iw-c {
          background: transparent !important;
          padding: 0 !important;
          box-shadow: none !important;
          border-radius: 14px !important;
        }
        .gm-style .gm-style-iw-d { overflow: hidden !important; }
        .gm-style .gm-style-iw-t::after { display: none !important; }
        .gm-style .gm-style-iw-tc::after { display: none !important; }
        .gm-style-iw-chr { display: none !important; }
        .gm-ui-hover-effect { display: none !important; }

        /* Leaflet Shop Marker & Popup styling */
        .leaflet-shop-3d-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-locallens-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
          border-radius: 14px !important;
        }
        .custom-locallens-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: normal !important;
        }
        .custom-locallens-popup .leaflet-popup-tip {
          display: none !important;
        }
      `}</style>
    </div>
  );
}

// ─── 2D Fallback ──────────────────────────────────────────────────────────────

function Fallback({ experiences, totalGuests, activeCount }: Dashboard3DGlobeProps) {
  const list = experiences || [];
  return (
    <div className="w-full h-[300px] bg-slate-900/95 rounded-2xl p-5 text-white flex flex-col justify-between border border-emerald-500/20">
      <div className="flex items-center gap-2 mb-3">
        <Store className="w-5 h-5 text-emerald-400" />
        <span className="text-sm font-bold text-white">Shop Locations · India</span>
        <span className="ml-auto text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {list.length} Shops
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2">
        {(list.length > 0 ? list : [
          { id: "1", name: "Versova Sunset Kayaking", city: "Mumbai",  rating: 4.9, price: 1200 },
          { id: "2", name: "Old Goa Heritage Walk",   city: "Goa",     rating: 4.8, price: 850  },
          { id: "3", name: "Pottery & Blue Art",       city: "Jaipur", rating: 5.0, price: 1500 },
        ]).map((e: any) => (
          <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
            <span className="text-2xl">🏪</span>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{e.name}</div>
              <div className="text-[10px] text-emerald-400">{e.city}</div>
            </div>
            <div className="text-right shrink-0">
              {e.price && <div className="text-[10px] text-emerald-300 font-mono">₹{e.price}</div>}
              {e.rating && <div className="text-[10px] text-amber-400">⭐ {e.rating}</div>}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-slate-400 flex justify-between border-t border-white/10 pt-2 mt-2">
        <span>👥 {totalGuests || 0} Total Guests</span>
        <span className="text-emerald-400">{activeCount || 0} Active Shops</span>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function Dashboard3DGlobe(props: Dashboard3DGlobeProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!ready) {
    return (
      <div className="w-full h-[300px] bg-[#0B1120] rounded-2xl flex items-center justify-center border border-emerald-500/20">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
          <Navigation className="w-4 h-4 animate-spin" />
          Initialising Map…
        </div>
      </div>
    );
  }

  return <GoogleIndiaMap {...props} />;
}

export default Dashboard3DGlobe;
