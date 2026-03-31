"use client";

import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";
import { Event } from "@/lib/types";

// 道東の主要エリアとその座標
const AREA_COORDS: Record<string, [number, number]> = {
  中標津: [43.5567, 144.9707],
  別海: [43.3962, 145.1197],
  釧路: [42.9849, 144.3820],
  根室: [43.3302, 145.5838],
  弟子屈: [43.4873, 144.4573],
  帯広: [42.9241, 143.1958],
  標茶: [43.2994, 144.6016],
  標津: [43.6607, 145.0724],
};

// venue_address または venue_name からおおよその座標を取得
function guessCoords(event: Event): [number, number] | null {
  const text = `${event.venue_name ?? ""} ${event.venue_address ?? ""}`;
  for (const [area, coords] of Object.entries(AREA_COORDS)) {
    if (text.includes(area)) return coords;
  }
  // 北海道だがエリア不明 → 道東中心(中標津付近)
  if (text.includes("北海道") || text.includes("hokkaido")) {
    return [43.5567, 144.9707];
  }
  return null;
}

interface Props {
  events: Event[];
  selectedEventId: string | null;
  onMarkerClick: (id: string) => void;
  mode: "map" | "satellite";
}

export default function LeafletMap({ events, selectedEventId, onMarkerClick, mode }: Props) {
  const mapRef = useRef<LMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let L: typeof import("leaflet");

    (async () => {
      L = (await import("leaflet")).default;

      // デフォルトアイコン修正（Next.jsではパスが壊れる）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [43.4, 144.8],
        zoom: 9,
        zoomControl: true,
      });

      const tileUrl =
        mode === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const attribution =
        mode === "satellite"
          ? "Tiles © Esri"
          : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

      mapRef.current = map;

      // マーカー追加
      addMarkers(L, map, events, onMarkerClick);
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タイルレイヤー切替
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      // TileLayer を削除（マーカーは残す）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((layer as any)._url) map.removeLayer(layer);
    });

    const tileUrl =
      mode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      mode === "satellite" ? "Tiles © Esri" : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    import("leaflet").then(({ default: L }) => {
      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);
    });
  }, [mode]);

  // イベント変化でマーカー再描画
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    import("leaflet").then(({ default: L }) => {
      // 既存マーカーをすべて削除
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      addMarkers(L, map, events, onMarkerClick);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // 選択されたイベントのマーカーに移動
  useEffect(() => {
    if (!selectedEventId || !mapRef.current) return;
    const marker = markersRef.current.get(selectedEventId);
    if (marker) {
      mapRef.current.flyTo(marker.getLatLng(), 13, { duration: 0.8 });
      marker.openPopup();
    }
  }, [selectedEventId]);

  function addMarkers(
    L: typeof import("leaflet"),
    map: LMap,
    evts: Event[],
    onClick: (id: string) => void
  ) {
    evts.forEach((event) => {
      const coords = guessCoords(event);
      if (!coords) return;

      // カスタムアイコン（飲み会=青, イベント=橙）
      const color = event.event_type === "nomikai" ? "#5B8EED" : "#F59E0B";
      const emoji = event.event_type === "nomikai" ? "🍻" : "🎪";

      const icon = L.divIcon({
        html: `<div style="background:${color};width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);font-size:14px">${emoji}</span>
        </div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:160px">
            <strong style="font-size:13px">${event.title}</strong><br/>
            <span style="font-size:11px;color:#666">${event.venue_name ?? ""}</span>
          </div>`,
          { closeButton: false }
        )
        .on("click", () => onClick(event.id));

      markersRef.current.set(event.id, marker);
    });
  }

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </>
  );
}
