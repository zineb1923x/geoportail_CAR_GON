/**
 * CoordinateDisplay — M1-02
 * Affichage permanent des coordonnées du curseur en Lambert Maroc (zone Sud)
 * et en WGS84, échelle graphique et numérique dynamique, cadre de localisation.
 * 
 * Référence TDR : M1-02
 */
import { useState, useEffect, useCallback } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import proj4 from 'proj4';
import { MapPin, Maximize2 } from 'lucide-react';

// Définition de la projection Lambert Maroc Zone Sud (Merchich / EPSG:26192)
// Merchich / Sud Maroc
const LAMBERT_MAROC =
  '+proj=lcc +lat_1=33.3 +lat_0=33.3 +lon_0=-5.4 +k_0=0.999625769 +x_0=500000 +y_0=300000 +a=6378249.2 +b=6356515 +towgs84=31,146,47,0,0,0,0 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

// Enregistrer la projection
proj4.defs('EPSG:26192', LAMBERT_MAROC);

/**
 * Calcule l'échelle approximative de la carte
 */
function computeScale(map) {
  const center = map.getCenter();
  const zoom = map.getZoom();
  // Résolution en mètres/pixel pour Web Mercator
  const metersPerPixel =
    (40075016.686 * Math.cos((center.lat * Math.PI) / 180)) /
    Math.pow(2, zoom + 8);
  // Échelle : 1 pixel ≈ metersPerPixel mètres ; taille écran ≈ 96 DPI → 1 px ≈ 0.000264583 m
  const scale = Math.round(metersPerPixel / 0.000264583);
  return scale;
}

/**
 * Génère l'échelle graphique (barre)
 */
function computeScaleBar(map) {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const metersPerPixel =
    (40075016.686 * Math.cos((center.lat * Math.PI) / 180)) /
    Math.pow(2, zoom + 8);

  // Trouver une valeur de barre ronde
  const targetWidthPx = 120;
  const targetMeters = metersPerPixel * targetWidthPx;
  const roundValues = [
    1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000,
    50000, 100000, 200000, 500000, 1000000,
  ];
  let bestValue = roundValues[0];
  for (const v of roundValues) {
    if (v <= targetMeters * 1.5) bestValue = v;
  }
  const barWidthPx = bestValue / metersPerPixel;

  let label;
  if (bestValue >= 1000) {
    label = (bestValue / 1000).toLocaleString('fr-FR') + ' km';
  } else {
    label = bestValue.toLocaleString('fr-FR') + ' m';
  }

  return { widthPx: Math.round(barWidthPx), label };
}

export default function CoordinateDisplay() {
  const map = useMap();
  const [coords, setCoords] = useState({
    lat: 0,
    lng: 0,
    lambertX: 0,
    lambertY: 0,
  });
  const [scale, setScale] = useState(1);
  const [scaleBar, setScaleBar] = useState({ widthPx: 100, label: '10 km' });

  const updateScale = useCallback(() => {
    if (!map) return;
    setScale(computeScale(map));
    setScaleBar(computeScaleBar(map));
  }, [map]);

  useMapEvents({
    mousemove(e) {
      const { lat, lng } = e.latlng;
      try {
        const [x, y] = proj4(WGS84, 'EPSG:26192', [lng, lat]);
        setCoords({ lat, lng, lambertX: x, lambertY: y });
      } catch {
        setCoords({ lat, lng, lambertX: 0, lambertY: 0 });
      }
    },
    zoomend() {
      updateScale();
    },
    moveend() {
      updateScale();
    },
  });

  useEffect(() => {
    updateScale();
  }, [updateScale]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.98) 100%)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        padding: '3px 12px',
        gap: '6px',
        fontFamily: "'Inter', sans-serif",
        fontSize: '11px',
        color: '#4a5568',
        userSelect: 'none',
        height: '28px',
      }}
    >
      {/* WGS84 Coordinates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={11} style={{ color: '#1b7a45', flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: '#2d3748', letterSpacing: '0.2px' }}>
          WGS84
        </span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10.5px', color: '#1a202c' }}>
          {coords.lat.toFixed(6)}°N {Math.abs(coords.lng).toFixed(6)}°{coords.lng < 0 ? 'W' : 'E'}
        </span>
      </div>

      {/* Separator */}
      <div style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

      {/* Lambert Maroc Coordinates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span
          style={{
            fontWeight: 600,
            color: '#c8a13a',
            fontSize: '9.5px',
            padding: '0 4px',
            background: 'rgba(200,161,58,0.1)',
            borderRadius: '3px',
            letterSpacing: '0.3px',
          }}
        >
          LAMBERT
        </span>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '10.5px', color: '#1a202c' }}>
          X={coords.lambertX.toFixed(1)} Y={coords.lambertY.toFixed(1)}
        </span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Graphical scale bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: `${scaleBar.widthPx}px`,
              height: '4px',
              background: 'linear-gradient(90deg, #1b7a45 0%, #1b7a45 50%, #0b3d23 50%, #0b3d23 100%)',
              borderRadius: '1px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: '-1px',
                width: '1px',
                height: '6px',
                background: '#1b7a45',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '-1px',
                width: '1px',
                height: '6px',
                background: '#0b3d23',
              }}
            />
          </div>
          <span style={{ fontSize: '9px', color: '#718096', marginTop: '1px', fontWeight: 500 }}>
            {scaleBar.label}
          </span>
        </div>
      </div>

      {/* Separator */}
      <div style={{ width: '1px', height: '14px', background: '#e2e8f0', margin: '0 2px' }} />

      {/* Numerical scale */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <Maximize2 size={10} style={{ color: '#718096' }} />
        <span style={{ fontWeight: 600, fontSize: '10.5px', color: '#2d3748' }}>
          1:{scale.toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
  );
}
