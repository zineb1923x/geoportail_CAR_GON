/**
 * MapNavControls — M1-01
 * Navigation continue multi-échelles : zoom molette et sur emprise,
 * déplacement, recentrage, vue générale de la région, historique précédent/suivant.
 * 
 * Référence TDR : M1-01
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import {
  ZoomIn, ZoomOut, Home, Undo2, Redo2, Crosshair, Maximize
} from 'lucide-react';

// Centre de la région Guelmim-Oued Noun
const REGION_CENTER = [28.98, -9.99];
const REGION_ZOOM = 9;

// Emprise approximative de la région
const REGION_BOUNDS = [
  [27.5, -12.0], // SW
  [30.0, -8.5],  // NE
];

const MAX_HISTORY = 30;

export default function MapNavControls() {
  const map = useMap();
  const [viewHistory, setViewHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isNavigating = useRef(false);

  // Record view changes into history
  useEffect(() => {
    if (!map) return;

    const recordView = () => {
      if (isNavigating.current) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const entry = { lat: center.lat, lng: center.lng, zoom };

      setViewHistory((prev) => {
        const newHist = prev.slice(0, historyIndex + 1);
        newHist.push(entry);
        if (newHist.length > MAX_HISTORY) newHist.shift();
        return newHist;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    };

    map.on('moveend', recordView);
    // Record initial view
    recordView();

    return () => {
      map.off('moveend', recordView);
    };
  }, [map]);

  const navigateTo = useCallback(
    (entry) => {
      isNavigating.current = true;
      map.setView([entry.lat, entry.lng], entry.zoom, { animate: true });
      setTimeout(() => {
        isNavigating.current = false;
      }, 500);
    },
    [map]
  );

  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    navigateTo(viewHistory[newIndex]);
  }, [historyIndex, viewHistory, navigateTo]);

  const goForward = useCallback(() => {
    if (historyIndex >= viewHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    navigateTo(viewHistory[newIndex]);
  }, [historyIndex, viewHistory, navigateTo]);

  const zoomIn = useCallback(() => map.zoomIn(), [map]);
  const zoomOut = useCallback(() => map.zoomOut(), [map]);

  const resetView = useCallback(() => {
    map.flyTo(REGION_CENTER, REGION_ZOOM, { duration: 1 });
  }, [map]);

  const fitRegion = useCallback(() => {
    map.flyToBounds(REGION_BOUNDS, { padding: [20, 20], duration: 1 });
  }, [map]);

  const locateMe = useCallback(() => {
    map.locate({ setView: true, maxZoom: 14 });
  }, [map]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < viewHistory.length - 1;

  const btnStyle = (disabled = false) => ({
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: 'transparent',
    color: disabled ? '#cbd5e0' : '#4a5568',
    transition: 'all 0.12s',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      {/* Zoom controls */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        <button onClick={zoomIn} title="Zoom avant" style={btnStyle()}>
          <ZoomIn size={16} />
        </button>
        <div style={{ height: '1px', background: '#f0f0f0', margin: '0 6px' }} />
        <button onClick={zoomOut} title="Zoom arrière" style={btnStyle()}>
          <ZoomOut size={16} />
        </button>
      </div>

      {/* Navigation controls */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        <button onClick={resetView} title="Vue générale de la région" style={btnStyle()}>
          <Home size={15} />
        </button>
        <button onClick={fitRegion} title="Ajuster à l'emprise régionale" style={btnStyle()}>
          <Maximize size={14} />
        </button>
        <button onClick={locateMe} title="Ma position" style={btnStyle()}>
          <Crosshair size={15} />
        </button>
      </div>

      {/* History controls */}
      <div
        style={{
          background: 'white',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          padding: '4px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px',
        }}
      >
        <button
          onClick={goBack}
          disabled={!canGoBack}
          title="Vue précédente"
          style={btnStyle(!canGoBack)}
        >
          <Undo2 size={14} />
        </button>
        <div style={{ height: '1px', background: '#f0f0f0', margin: '0 6px' }} />
        <button
          onClick={goForward}
          disabled={!canGoForward}
          title="Vue suivante"
          style={btnStyle(!canGoForward)}
        >
          <Redo2 size={14} />
        </button>
      </div>
    </div>
  );
}
