"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import { RotateCcw } from "lucide-react";
import "leaflet/dist/leaflet.css";

export type DiscoveryMapPlace = {
  id: string;
  name: string;
  position: [number, number];
  number: number;
};

type Runtime = {
  leaflet: typeof import("leaflet");
  map: LeafletMap;
  layer: LayerGroup;
  markers: Map<string, Marker>;
  positions: [number, number][];
};

type Props = {
  places: DiscoveryMapPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function fitPlaces(runtime: Runtime) {
  if (!runtime.positions.length) return;
  runtime.map.fitBounds(runtime.positions, {
    padding: [54, 54],
    maxZoom: 13,
    animate: false,
  });
}

export default function DiscoveryMap({ places, selectedId, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<Runtime | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [retry, setRetry] = useState(0);
  const placesKey = JSON.stringify(places);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    let activeMap: LeafletMap | null = null;
    let observer: ResizeObserver | null = null;

    import("leaflet").then((leaflet) => {
      if (cancelled || !containerRef.current) return;
      const map = leaflet.map(containerRef.current, {
        center: [51.6, -1.1],
        zoom: 8,
        minZoom: 5,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: false,
        zoomAnimation: false,
        fadeAnimation: false,
      });
      activeMap = map;
      leaflet.control.zoom({ position: "bottomright", zoomInTitle: "放大地图", zoomOutTitle: "缩小地图" }).addTo(map);
      const runtime: Runtime = {
        leaflet,
        map,
        layer: leaflet.layerGroup().addTo(map),
        markers: new Map(),
        positions: [],
      };
      runtimeRef.current = runtime;
      let wasVisible = false;
      observer = new ResizeObserver(() => {
        if (cancelled || !containerRef.current) return;
        const box = containerRef.current.getBoundingClientRect();
        const visible = box.width > 0 && box.height > 0;
        if (visible) {
          map.invalidateSize({ animate: false, pan: false });
          if (!wasVisible) fitPlaces(runtime);
        }
        wasVisible = visible;
      });
      observer.observe(containerRef.current);
      setReady(true);
    }).catch(() => {
      if (!cancelled) setMapError(true);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      activeMap?.remove();
      runtimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return;
    const nextPlaces: DiscoveryMapPlace[] = JSON.parse(placesKey);
    runtime.layer.clearLayers();
    runtime.markers.clear();
    runtime.positions = nextPlaces.map((place) => place.position);
    nextPlaces.forEach((place) => {
      const label = document.createElement("span");
      label.textContent = String(place.number).padStart(2, "0");
      const marker = runtime.leaflet.marker(place.position, {
        icon: runtime.leaflet.divIcon({
          className: "discovery-pin",
          html: label,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
        keyboard: true,
        riseOnHover: true,
        title: `${place.number}. ${place.name}`,
      }).on("click", () => onSelectRef.current(place.id)).addTo(runtime.layer);
      const element = marker.getElement();
      element?.setAttribute("aria-label", `阅读${place.name}的故事`);
      element?.setAttribute("role", "button");
      element?.addEventListener("keydown", (event) => {
        if (event.key === " ") {
          event.preventDefault();
          onSelectRef.current(place.id);
        }
      });
      runtime.markers.set(place.id, marker);
    });
    fitPlaces(runtime);
  }, [ready, placesKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return;
    runtime.markers.forEach((marker, id) => {
      const selected = id === selectedId;
      marker.getElement()?.classList.toggle("discovery-pin--selected", selected);
      marker.getElement()?.setAttribute("aria-pressed", String(selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (selected) runtime.map.panInside(marker.getLatLng(), {
        padding: [45, 45],
        animate: false,
      });
    });
  }, [ready, selectedId, placesKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!ready || !runtime) return;
    const tiles = runtime.leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      keepBuffer: 1,
      updateWhenIdle: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    });
    const handleError = () => setTileError(true);
    tiles.on("tileerror", handleError);
    tiles.addTo(runtime.map);
    return () => {
      tiles.off("tileerror", handleError);
      tiles.remove();
    };
  }, [ready, retry]);

  return (
    <div className="discovery-map" aria-label="故事地点地图">
      <div ref={containerRef} className="discovery-map__canvas" aria-label="可拖动缩放的地点地图，编号对应故事列表" />
      {!ready && (
        <div className="discovery-map__placeholder" role="status">
          <span>{mapError ? "地图暂时无法加载" : "正在展开地图…"}</span>
          <p>{mapError ? "故事列表与参观资料仍可正常阅读，请稍后刷新重试。" : "也可以先从一个故事开始阅读。"}</p>
        </div>
      )}
      {tileError && (
        <div className="discovery-map__warning" role="status">
          <p>部分底图未能加载，地点标记与故事仍可使用。</p>
          <button type="button" onClick={() => { setTileError(false); setRetry((value) => value + 1); }}><RotateCcw size={12} /> 重试底图</button>
        </div>
      )}
      <div className="discovery-map__credit">
        <a href="https://leafletjs.com" target="_blank" rel="noreferrer">Leaflet</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>
      </div>
    </div>
  );
}
