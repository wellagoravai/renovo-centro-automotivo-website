// Posição GPS enviada pelo cliente (veículo em área rural, sem endereço): aceita
// "-21.12345, -50.43210" ou um link do Google Maps com as coordenadas
// (?q=lat,lng, @lat,lng, /place/lat,lng). Links curtos (maps.app.goo.gl) não
// trazem as coordenadas no texto e não são reconhecidos.
export interface LatLng {
  lat: number;
  lng: number;
}

const NUMBER = '(-?\\d{1,3}(?:\\.\\d+)?)';
const PAIR = new RegExp(`${NUMBER}\\s*,\\s*${NUMBER}`);

export function parseLatLng(raw: string): LatLng | null {
  let text = raw.trim();
  if (!text) return null;
  try {
    text = decodeURIComponent(text);
  } catch {
    // Texto com "%" solto: segue como veio.
  }

  const match = text.match(PAIR);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export const formatLatLng = ({ lat, lng }: LatLng) => `${lat.toFixed(6)},${lng.toFixed(6)}`;
