export function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371; // km
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Rough ETA estimate using constant speed.
 * This is intentionally simple; you can replace with Google Distance Matrix later.
 */
export function estimateEtaMinutes(distanceKm: number, speedKmh: number = 25) {
  if (!isFinite(distanceKm) || distanceKm <= 0) return 0;
  const hours = distanceKm / speedKmh;
  return Math.max(1, Math.round(hours * 60));
}

export function formatEta(minutes: number) {
  if (!minutes || minutes <= 0) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}
