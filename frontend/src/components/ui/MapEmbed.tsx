import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * El mapa de la ficha de producto.
 *
 * **Con Leaflet y OpenStreetMap, no con el iframe de Google.** El de Google
 * pedía una clave que aquí no hay: sin ella pinta un recuadro azul con una
 * marca de agua encima, que es peor que no enseñar mapa. Los teselados de
 * OpenStreetMap se sirven sin clave y ya están permitidos en la política de
 * seguridad del sitio, igual que en los otros dos mapas de la aplicación.
 *
 * El marcador es HTML nuestro, así que se puede animar; dentro de un iframe de
 * otro origen no se podía tocar.
 */
const pin = L.divIcon({
  className: '',
  html: `
    <span class="map-pin">
      <span class="map-pin__halo"></span>
      <svg class="map-pin__body" width="34" height="42" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8z"/>
        <circle cx="12" cy="10" r="3" fill="#fff"/>
      </svg>
    </span>`,
  iconSize: [34, 42],
  iconAnchor: [17, 42],
});

interface MapEmbedProps {
  /** Identificador del elemento, para engancharlo desde fuera. */
  id?: string;
  latitude: number;
  longitude: number;
  label?: string;
  className?: string;
  /** Cuando el mapa es solo fondo: fuera del tabulador y del lector de pantalla. */
  decorative?: boolean;
}

export function MapEmbed({
  id,
  latitude,
  longitude,
  label,
  className,
  decorative = false,
}: MapEmbedProps) {
  return (
    <div
      id={id}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={
        decorative ? undefined : label ? `Mapa de ${label}` : 'Mapa de ubicación'
      }
      aria-hidden={decorative || undefined}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        className="h-full w-full"
        /* Para mirar, no para navegar: la ficha ya lleva «¿Cómo llegar?» para
           quien quiera moverse de verdad. Así, además, arrastrar sigue
           desplazando la página en el móvil en vez de quedarse atrapado
           dentro del mapa. */
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} icon={pin} />
      </MapContainer>
    </div>
  );
}
