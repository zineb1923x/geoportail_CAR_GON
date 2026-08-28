/**
 * SwipeControl — M1-05
 * Comparaison temporelle par volet glissant (« swipe ») entre deux millésimes
 * d'une même couche (ex. OCS 2024 / 2026).
 * 
 * Référence TDR : M1-05
 * 
 * Utilise un clip CSS sur le conteneur de tuiles pour afficher la couche gauche
 * et la couche droite de part et d'autre d'un curseur déplaçable.
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMap, TileLayer } from 'react-leaflet';
import { SplitSquareHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Couches millésimées de démonstration
const SWIPE_LAYERS = [
  {
    id: 'esri_2024',
    name: 'Satellite 2024',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    id: 'osm_2026',
    name: 'OpenStreetMap 2026',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    id: 'topo',
    name: 'Fond topographique',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  },
];

export default function SwipeControl() {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState(50); // percentage
  const [leftLayer, setLeftLayer] = useState(SWIPE_LAYERS[0].id);
  const [rightLayer, setRightLayer] = useState(SWIPE_LAYERS[1].id);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);
  const map = useMap();

  const getLayerUrl = (id) =>
    SWIPE_LAYERS.find((l) => l.id === id)?.url || SWIPE_LAYERS[0].url;

  const getLayerName = (id) =>
    SWIPE_LAYERS.find((l) => l.id === id)?.name || '';

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging) return;
      const mapContainer = map.getContainer();
      const rect = mapContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      setPosition(Math.max(5, Math.min(95, x)));
    },
    [dragging, map]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!dragging) return;
      const touch = e.touches[0];
      const mapContainer = map.getContainer();
      const rect = mapContainer.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) / rect.width) * 100;
      setPosition(Math.max(5, Math.min(95, x)));
    },
    [dragging, map]
  );

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Disable map dragging during swipe drag
  useEffect(() => {
    if (dragging) {
      map.dragging.disable();
    } else {
      map.dragging.enable();
    }
  }, [dragging, map]);

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        title="Comparaison temporelle (swipe)"
        style={{
          position: 'absolute',
          top: '10px',
          right: '60px',
          zIndex: 1000,
          width: '34px',
          height: '34px',
          background: 'white',
          border: 'none',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#4a5568',
          transition: 'all 0.15s',
        }}
      >
        <SplitSquareHorizontal size={16} />
      </button>
    );
  }

  return (
    <>
      {/* Left tile layer (clipped to left side) */}
      <TileLayer
        url={getLayerUrl(leftLayer)}
        className="swipe-left-layer"
        pane="tilePane"
      />

      {/* Right tile layer (clipped to right side) */}
      <TileLayer
        url={getLayerUrl(rightLayer)}
        className="swipe-right-layer"
        pane="tilePane"
      />

      {/* CSS clip styles injected */}
      <style>{`
        .swipe-left-layer .leaflet-tile-container {
          clip-path: inset(0 ${100 - position}% 0 0);
        }
        .swipe-right-layer .leaflet-tile-container {
          clip-path: inset(0 0 0 ${position}%);
        }
      `}</style>

      {/* Swipe handle */}
      <div
        style={{
          position: 'absolute',
          left: `${position}%`,
          top: 0,
          bottom: '28px', // Leave space for coord bar
          width: '4px',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          cursor: 'col-resize',
          background: 'white',
          boxShadow: '0 0 8px rgba(0,0,0,0.25)',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        {/* Drag handle circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '36px',
            height: '36px',
            background: 'white',
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
          }}
        >
          <ChevronLeft size={12} style={{ color: '#4a5568' }} />
          <ChevronRight size={12} style={{ color: '#4a5568' }} />
        </div>
      </div>

      {/* Labels */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '12px',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
      >
        ← {getLayerName(leftLayer)}
      </div>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '60px',
          zIndex: 1001,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          pointerEvents: 'none',
        }}
      >
        {getLayerName(rightLayer)} →
      </div>

      {/* Control panel */}
      <div
        style={{
          position: 'absolute',
          top: '40px',
          right: '10px',
          zIndex: 1001,
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          padding: '12px 14px',
          width: '220px',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontWeight: 700, color: '#1a202c', fontSize: '12px' }}>
            <SplitSquareHorizontal size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px' }} />
            Comparaison
          </span>
          <button
            onClick={() => setActive(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a0aec0',
              padding: '2px',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <label style={{ color: '#718096', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Couche gauche
        </label>
        <select
          value={leftLayer}
          onChange={(e) => setLeftLayer(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            marginTop: '3px',
            marginBottom: '8px',
            outline: 'none',
          }}
        >
          {SWIPE_LAYERS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>

        <label style={{ color: '#718096', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Couche droite
        </label>
        <select
          value={rightLayer}
          onChange={(e) => setRightLayer(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            fontSize: '11px',
            marginTop: '3px',
            outline: 'none',
          }}
        >
          {SWIPE_LAYERS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
