"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./itinerary-map.css";

export type ItineraryMapStop = {
  id: string;
  name: string;
  position: [number, number];
};

type ItineraryMapProps = {
  stops: ItineraryMapStop[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

type MapRuntime = {
  leaflet: typeof import("leaflet");
  map: LeafletMap;
  points: LayerGroup;
  markers: Map<string, Marker>;
  stopsKey: string | null;
  positions: [number, number][];
};

function fitStops(runtime: MapRuntime) {
  if (!runtime.positions.length) return;
  runtime.map.fitBounds(runtime.positions, {
    padding: [45, 45],
    maxZoom: 13,
    animate: false,
  });
}

export default function ItineraryMap({
  stops,
  selectedId,
  onSelect,
}: ItineraryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const runtimeRef = useRef<MapRuntime | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const stopsKey = JSON.stringify(stops);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    let cancelled = false;
    let activeMap: LeafletMap | null = null;
    let observer: ResizeObserver | null = null;

    // Leaflet reads window when imported, so load it only after mounting.
    import("leaflet")
      .then((leaflet) => {
        if (cancelled || !containerRef.current) return;
        const map = leaflet.map(containerRef.current, {
          center: [51.5074, -0.1278],
          zoom: 12,
          minZoom: 5,
          maxZoom: 19,
          scrollWheelZoom: false,
          zoomControl: false,
          attributionControl: false,
          zoomAnimation: false,
          fadeAnimation: false,
        });
        activeMap = map;
        leaflet.control
          .zoom({
            position: "topright",
            zoomInTitle: "放大地图",
            zoomOutTitle: "缩小地图",
          })
          .addTo(map);

        const nextRuntime: MapRuntime = {
          leaflet,
          map,
          points: leaflet.layerGroup().addTo(map),
          markers: new Map(),
          stopsKey: null,
          positions: [],
        };

        let wasVisible = false;
        observer = new ResizeObserver(() => {
          if (cancelled || !containerRef.current) return;
          const { width, height } =
            containerRef.current.getBoundingClientRect();
          const visible = width > 0 && height > 0;
          if (visible) {
            map.invalidateSize({ animate: false, pan: false });
            if (!wasVisible) fitStops(nextRuntime);
          }
          wasVisible = visible;
        });
        observer.observe(containerRef.current);
        runtimeRef.current = nextRuntime;
        setMapReady(true);
      })
      .catch(() => {
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
    if (!runtime || runtime.stopsKey === stopsKey) return;
    const nextStops: ItineraryMapStop[] = JSON.parse(stopsKey);
    runtime.stopsKey = stopsKey;
    runtime.points.clearLayers();
    runtime.markers.clear();
    runtime.positions = nextStops.map((stop) => stop.position);

    nextStops.forEach((stop, index) => {
      const number = document.createElement("span");
      number.className = "itinerary-map__marker-number";
      number.textContent = String(index + 1);
      const icon = runtime.leaflet.divIcon({
        className: "itinerary-map__marker",
        html: number,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = runtime.leaflet
        .marker(stop.position, {
          icon,
          title: `${index + 1}. ${stop.name}`,
          keyboard: true,
          riseOnHover: true,
        })
        .on("click", () => onSelectRef.current(stop.id))
        .addTo(runtime.points);

      const element = marker.getElement();
      element?.setAttribute(
        "aria-label",
        `查看第 ${index + 1} 站：${stop.name}`,
      );
      element?.setAttribute("role", "button");
      // Leaflet already handles Enter on keyboard-enabled markers.
      element?.addEventListener("keydown", (event) => {
        if (event.key === " ") {
          event.preventDefault();
          onSelectRef.current(stop.id);
        }
      });
      runtime.markers.set(stop.id, marker);
    });
    fitStops(runtime);
  }, [mapReady, stopsKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.markers.forEach((marker, id) => {
      const selected = id === selectedId;
      const element = marker.getElement();
      element?.classList.toggle("itinerary-map__marker--selected", selected);
      element?.setAttribute("aria-pressed", String(selected));
      marker.setZIndexOffset(selected ? 1000 : 0);
      if (selected) {
        runtime.map.panInside(marker.getLatLng(), {
          padding: [45, 45],
          animate: false,
        });
      }
    });
  }, [mapReady, selectedId, stopsKey]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;

    // Direct browser requests keep normal Referer and HTTP caching behavior.
    // No tile prefetch, offline download, proxy, or cache-busting parameters.
    const tiles = runtime.leaflet.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        keepBuffer: 1,
        updateWhenIdle: true,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    );
    const handleTileError = () => setTileError(true);
    tiles.on("tileerror", handleTileError);
    tiles.addTo(runtime.map);
    return () => {
      tiles.off("tileerror", handleTileError);
      tiles.remove();
    };
  }, [mapReady, retryCount]);

  function retryBasemap() {
    setTileError(false);
    setRetryCount((value) => value + 1);
  }

  return (
    <section className="itinerary-map" aria-label="当日地点地图">
      <div className="itinerary-map__surface">
        <div
          ref={containerRef}
          className="itinerary-map__canvas"
          aria-label="可拖动和缩放的示例地点地图"
        />
        {!mapReady && (
          <div className="itinerary-map__placeholder" role="status">
            {mapError
              ? "地图组件加载失败，请刷新页面重试。仍可使用行程列表查看地点。"
              : "正在载入地图组件…"}
          </div>
        )}
        {mapReady && !stops.length && (
          <div className="itinerary-map__empty" role="status">
            当天暂无展示地点
          </div>
        )}
        <div className="itinerary-map__attribution">
          <a href="https://leafletjs.com" target="_blank" rel="noreferrer">
            Leaflet
          </a>
          <span> · © </span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>
        </div>
      </div>

      <p className="itinerary-map__note">重点地点 · 位置近似，非导航</p>

      {tileError && mapReady && (
        <div className="itinerary-map__notice" role="status">
          <p>底图未能完整加载，地点列表仍可使用。</p>
          <button type="button" onClick={retryBasemap}>
            重试底图
          </button>
        </div>
      )}
    </section>
  );
}
