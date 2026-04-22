"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import useAuthGuard from "../../hooks/useAuthGuard";
import api from "../../lib/api";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((module) => module.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false }
);

export default function HeatmapPage() {
  const { isChecking, isAuthorized } = useAuthGuard();
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const fetchCases = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("/cases");
        setCases(response.data?.cases || []);
      } catch (apiError) {
        setError(apiError.response?.data?.message || "Failed to load heatmap data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCases();
  }, [isAuthorized]);

  const points = useMemo(
    () =>
      cases
        .filter((item) => item?.coordinates?.latitude !== undefined && item?.coordinates?.longitude !== undefined)
        .map((item) => ({
          ...item,
          latitude: Number(item.coordinates.latitude),
          longitude: Number(item.coordinates.longitude),
        }))
        .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)),
    [cases]
  );

  const mapCenter = useMemo(() => {
    if (!points.length) {
      return [20.5937, 78.9629];
    }

    const totalLat = points.reduce((sum, point) => sum + point.latitude, 0);
    const totalLng = points.reduce((sum, point) => sum + point.longitude, 0);

    return [totalLat / points.length, totalLng / points.length];
  }, [points]);

  if (isChecking) {
    return <div className="cims-card text-text-secondary p-6 text-sm">Checking authentication...</div>;
  }

  if (!isAuthorized) {
    return null;
  }

  if (isLoading) {
    return <div className="cims-card text-text-secondary p-6 text-sm">Loading heatmap...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="cims-card p-6">
        <h3 className="text-text-primary text-lg font-semibold">Crime Heatmap</h3>
        <p className="text-text-secondary mt-1 text-sm">Cases are plotted using stored location coordinates.</p>
        {error ? <p className="mt-3 text-sm font-medium text-rose-600">{error}</p> : null}
        {!points.length ? <p className="text-text-secondary mt-3 text-sm">No coordinates found yet. Add latitude and longitude in Add Case page.</p> : null}

        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
          <div className="h-140 w-full">
            <MapContainer center={mapCenter} zoom={5} scrollWheelZoom className="h-full w-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {points.map((point) => (
                <CircleMarker
                  key={point._id}
                  center={[point.latitude, point.longitude]}
                  radius={12}
                  pathOptions={{
                    color: "#dc2626",
                    fillColor: "#ef4444",
                    fillOpacity: 0.35,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{point.title}</p>
                      <p className="capitalize">Status: {point.status}</p>
                      <p>Location: {point.location}</p>
                      <p>Crime: {point.crime_type}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>
      </section>
    </div>
  );
}