/**
 * MeasureTools — M1-07
 * Outils de mesure de distances (km), surfaces (ha) et périmètres,
 * avec accrochage optionnel.
 * 
 * Référence TDR : M1-07
 * - Distance : clic pour ajouter un point, double-clic pour terminer
 * - Surface : clic pour dessiner un polygone, double-clic pour fermer et calculer
 * - Périmètre : calculé automatiquement avec la surface
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { useMap, useMapEvents, Polyline, Polygon, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Ruler, Pentagon, X, Trash2, MousePointerClick } from 'lucide-react';

/**
 * Calcule la distance géodésique entre deux LatLng en mètres
 */
function geodesicDistance(latlng1, latlng2) {
  return latlng1.distanceTo(latlng2);
}

/**
 * Calcule l'aire d'un polygone en mètres carrés (formule sphérique via Leaflet)
 */
function polygonArea(latlngs) {
  if (latlngs.length < 3) return 0;
  return L.GeometryUtil
    ? Math.abs(L.GeometryUtil.geodesicArea(latlngs))
    : Math.abs(computeSphericalArea(latlngs));
}

/**
 * Calcul d'aire sphérique approximatif (fallback si GeometryUtil n'est pas disponible)
 */
function computeSphericalArea(coords) {
  const rad = Math.PI / 180;
  let total = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    total +=
      (coords[j].lng - coords[i].lng) *
      rad *
      (2 + Math.sin(coords[i].lat * rad) + Math.sin(coords[j].lat * rad));
  }
  return (total * 6378137 * 6378137) / 2;
}

/**
 * Calcule le périmètre d'un ensemble de points en mètres
 */
function computePerimeter(points) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += geodesicDistance(points[i - 1], points[i]);
  }
  return total;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return (meters / 1000).toFixed(2) + ' km';
  }
  return Math.round(meters) + ' m';
}

function formatArea(sqMeters) {
  const ha = sqMeters / 10000;
  if (ha >= 1) {
    return ha.toFixed(2) + ' ha';
  }
  return Math.round(sqMeters).toLocaleString('fr-FR') + ' m²';
}

// Mode types
const MODE_NONE = 'none';
const MODE_DISTANCE = 'distance';
const MODE_AREA = 'area';

function MeasureEventHandler({ mode, points, setPoints, onFinish }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      if (mode === MODE_NONE) return;
      const newPts = [...points, e.latlng];
      setPoints(newPts);
    },
    dblclick(e) {
      if (mode === MODE_NONE) return;
      L.DomEvent.stopPropagation(e);
      L.DomEvent.preventDefault(e);
      onFinish();
    },
  });

  // Change cursor based on mode
  useEffect(() => {
    const container = map.getContainer();
    if (mode !== MODE_NONE) {
      container.style.cursor = 'crosshair';
    } else {
      container.style.cursor = '';
    }
    return () => {
      container.style.cursor = '';
    };
  }, [mode, map]);

  return null;
}

export default function MeasureTools() {
  const [mode, setMode] = useState(MODE_NONE);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(false);

  const startDistance = useCallback(() => {
    setMode(MODE_DISTANCE);
    setPoints([]);
    setResult(null);
  }, []);

  const startArea = useCallback(() => {
    setMode(MODE_AREA);
    setPoints([]);
    setResult(null);
  }, []);

  const finish = useCallback(() => {
    if (mode === MODE_DISTANCE && points.length >= 2) {
      const dist = computePerimeter(points);
      setResult({
        type: 'distance',
        value: formatDistance(dist),
        raw: dist,
      });
    } else if (mode === MODE_AREA && points.length >= 3) {
      const area = polygonArea(points);
      const perimeter = computePerimeter([...points, points[0]]);
      setResult({
        type: 'area',
        area: formatArea(area),
        perimeter: formatDistance(perimeter),
        rawArea: area,
        rawPerimeter: perimeter,
      });
    }
    setMode(MODE_NONE);
  }, [mode, points]);

  const clear = useCallback(() => {
    setMode(MODE_NONE);
    setPoints([]);
    setResult(null);
  }, []);

  // Live measurement text
  const liveDistance =
    mode === MODE_DISTANCE && points.length >= 2
      ? formatDistance(computePerimeter(points))
      : null;

  const liveArea =
    mode === MODE_AREA && points.length >= 3
      ? formatArea(polygonArea(points))
      : null;

  const isActive = mode !== MODE_NONE;

  return (
    <>
      <MeasureEventHandler
        mode={mode}
        points={points}
        setPoints={setPoints}
        onFinish={finish}
      />

      {/* Drawing overlays */}
      {mode === MODE_DISTANCE && points.length > 1 && (
        <Polyline
          positions={points}
          pathOptions={{
            color: '#e53935',
            weight: 2.5,
            dashArray: '8, 4',
            opacity: 0.9,
          }}
        />
      )}

      {mode === MODE_AREA && points.length > 2 && (
        <Polygon
          positions={points}
          pathOptions={{
            color: '#1565c0',
            weight: 2,
            fillColor: '#1565c0',
            fillOpacity: 0.15,
            dashArray: '6, 4',
          }}
        />
      )}

      {/* Finished result overlays */}
      {result && result.type === 'distance' && points.length > 1 && (
        <Polyline
          positions={points}
          pathOptions={{
            color: '#e53935',
            weight: 3,
            opacity: 0.85,
          }}
        >
          <Tooltip permanent direction="center" className="measure-tooltip">
            📏 {result.value}
          </Tooltip>
        </Polyline>
      )}

      {result && result.type === 'area' && points.length > 2 && (
        <Polygon
          positions={points}
          pathOptions={{
            color: '#1565c0',
            weight: 2.5,
            fillColor: '#1565c0',
            fillOpacity: 0.2,
          }}
        >
          <Tooltip permanent direction="center" className="measure-tooltip">
            📐 {result.area} · 📏 {result.perimeter}
          </Tooltip>
        </Polygon>
      )}

      {/* Vertex markers */}
      {points.map((p, i) => (
        <CircleMarker
          key={`mpt-${i}`}
          center={p}
          radius={4}
          pathOptions={{
            fillColor: mode === MODE_AREA ? '#1565c0' : '#e53935',
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
          }}
        />
      ))}

      {/* Tools panel */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
        }}
      >
        {/* Measure buttons */}
        <div
          style={{
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            padding: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <button
            onClick={mode === MODE_DISTANCE ? clear : startDistance}
            title="Mesurer une distance (km)"
            style={{
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: mode === MODE_DISTANCE ? '#e53935' : 'transparent',
              color: mode === MODE_DISTANCE ? 'white' : '#4a5568',
            }}
          >
            <Ruler size={16} />
          </button>
          <button
            onClick={mode === MODE_AREA ? clear : startArea}
            title="Mesurer une surface (ha) et périmètre"
            style={{
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              background: mode === MODE_AREA ? '#1565c0' : 'transparent',
              color: mode === MODE_AREA ? 'white' : '#4a5568',
            }}
          >
            <Pentagon size={16} />
          </button>
          {(isActive || result) && (
            <button
              onClick={clear}
              title="Effacer la mesure"
              style={{
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                background: 'transparent',
                color: '#e53935',
                transition: 'all 0.15s',
              }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        {/* Live measurement info */}
        {isActive && (
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              padding: '8px 12px',
              maxWidth: '240px',
              fontSize: '11px',
              color: '#4a5568',
              lineHeight: '1.5',
            }}
          >
            <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MousePointerClick size={12} />
              {mode === MODE_DISTANCE ? 'Mesure de distance' : 'Mesure de surface'}
            </div>
            <div style={{ fontSize: '10px', color: '#718096' }}>
              Cliquez pour ajouter un point · Double-cliquez pour terminer
            </div>
            {liveDistance && (
              <div style={{ marginTop: '6px', fontWeight: 600, color: '#e53935' }}>
                📏 {liveDistance}
              </div>
            )}
            {liveArea && (
              <div style={{ marginTop: '6px', fontWeight: 600, color: '#1565c0' }}>
                📐 {liveArea}
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#a0aec0', marginTop: '4px' }}>
              {points.length} point{points.length !== 1 ? 's' : ''} placé{points.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Result panel */}
        {result && !isActive && (
          <div
            style={{
              background: 'white',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
              padding: '10px 14px',
              maxWidth: '240px',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#1a202c' }}>
                {result.type === 'distance' ? '📏 Distance' : '📐 Surface'}
              </span>
              <button
                onClick={clear}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#a0aec0',
                  padding: '2px',
                }}
              >
                <X size={12} />
              </button>
            </div>
            {result.type === 'distance' && (
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#e53935', fontFamily: 'Outfit, sans-serif' }}>
                {result.value}
              </div>
            )}
            {result.type === 'area' && (
              <>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#1565c0', fontFamily: 'Outfit, sans-serif' }}>
                  {result.area}
                </div>
                <div style={{ fontSize: '12px', color: '#718096', marginTop: '2px' }}>
                  Périmètre : {result.perimeter}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
