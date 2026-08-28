/**
 * MapPanel — Panneau cartographique principal
 * 
 * Intègre les composants M1 :
 * - M1-01 : MapNavControls (zoom, emprise, historique)
 * - M1-02 : CoordinateDisplay (coordonnées Lambert/WGS84, échelle)
 * - M1-05 : SwipeControl (comparaison temporelle)
 * - M1-07 : MeasureTools (mesures distances/surfaces/périmètres)
 * - M1-08 : Interrogation ponctuelle (parcel card)
 */
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Tooltip, useMap, useMapEvents, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../../context/AppContext';

// M1 Components
import CoordinateDisplay from './CoordinateDisplay';
import MeasureTools from './MeasureTools';
import MapNavControls from './MapNavControls';
import SwipeControl from './SwipeControl';

function LocalizedFeatureRenderer({ feature }) {
  const map = useMap();

  useEffect(() => {
    if (feature && feature.geometry) {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        map.flyTo([lat, lng], 14);
      } else {
        const layer = L.geoJSON(feature);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
      }
    }
  }, [feature, map]);

  if (!feature) return null;

  const featureKey = JSON.stringify(feature.geometry.coordinates);

  return (
    <GeoJSON 
      key={featureKey}
      data={feature} 
      style={{
        color: '#ff1744',
        weight: 4,
        fillColor: '#ff1744',
        fillOpacity: 0.2,
        dashArray: '5, 5'
      }}
      pointToLayer={(geoJsonPoint, latlng) => {
        return L.circleMarker(latlng, {
          radius: 8,
          fillColor: "#ff1744",
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        });
      }}
    />
  );
}

export default function MapPanel() {
  const { 
    selectedParcel, setSelectedParcel, simActive, go, followParcel,
    serverCouches, token, localizedFeature,
    layerVis, subVis, catVis, carOpacity, setLayerVis, setSubVis, setCatVis, setCarOpacity
  } = useApp();

  const [parcCardVisible, setParcCardVisible] = useState(false);
  const [hitIds, setHitIds] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState({});
  const [mapRef, setMapRef] = useState(null);

  const isLayerVisible = (c) => {
    const th = c.thematique || '';
    const txt = (c.nom_technique || '').toLowerCase() + ' ' + (c.nom_affichage || '').toLowerCase();
    
    if ((th === 'communes' || txt.includes('commune')) && layerVis.communes) return true;
    if ((th === 'provinces' || txt.includes('province')) && layerVis.provinces) return true;
    if ((th === 'regions' || txt.includes('region') || txt.includes('région')) && layerVis.regions) return true;
    
    if (th === 'car_a' && layerVis.car && catVis.A) return true;
    if (th === 'car_b' && layerVis.car && catVis.B) return true;
    if (th === 'car_c' && layerVis.car && catVis.C) return true;
    if ((th === 'classement' || txt.includes('car')) && !['car_a', 'car_b', 'car_c'].includes(th) && layerVis.car) return true;
    
    if (th === 'sols' && layerVis.sols) return true;
    if (th === 'oued' && layerVis.oued) return true;
    
    if (th === 'eau_forage' && layerVis.eau && subVis.eau.forage) return true;
    if (th === 'eau_puits' && layerVis.eau && subVis.eau.puits) return true;
    if (th === 'eau_source' && layerVis.eau && subVis.eau.source) return true;
    
    if (th === 'gh' && layerVis.gh) return true;
    if (th === 'pmh' && layerVis.pmh) return true;
    if (th === 'ppp' && layerVis.ppp) return true;
    if (th === 'priv' && layerVis.priv) return true;
    if (th === 'nappes' && layerVis.nappes) return true;
    if (th === 'pei' && layerVis.pei) return true;
    
    if (th === 'oasis' && layerVis.oasis) return true;
    if (th === 'past' && layerVis.past) return true;
    
    if (th === 'proj_p1' && layerVis.proj && subVis.proj.p1) return true;
    if (th === 'proj_p2' && layerVis.proj && subVis.proj.p2) return true;
    if (th === 'proj_mca' && layerVis.proj && subVis.proj.mca) return true;
    if (th === 'proj_pmvb' && layerVis.proj && subVis.proj.pmvb) return true;
    if (th === 'proj_pam' && layerVis.proj && subVis.proj.pam) return true;
    
    if (th === 'urb' && layerVis.urb) return true;
    if (th === 'ra' && layerVis.ra) return true;
    if (th === 'ocs' && layerVis.ocs) return true;
    if (th === 'bati' && layerVis.bati) return true;
    if (th === 'tf' && layerVis.tf) return true;
    
    if (th === 'stat_melk' && layerVis.stat && subVis.stat.melk) return true;
    if (th === 'stat_coll' && layerVis.stat && subVis.stat.coll) return true;
    if (th === 'stat_hab' && layerVis.stat && subVis.stat.hab) return true;
    if (th === 'stat_dom' && layerVis.stat && subVis.stat.dom) return true;

    return false;
  };

  // Load GeoJSON for visible layers
  useEffect(() => {
    if (!serverCouches || serverCouches.length === 0) return;
    
    const validCouches = serverCouches.filter(c => c.statut === 'validee' || c.statut === 'opposable');
    const activeLayers = validCouches.filter(isLayerVisible);
    
    activeLayers.forEach(c => {
      if (!geoJsonData[c.id]) {
        const t = token || localStorage.getItem('token');
        const headers = {};
        if (t && t !== 'guest') headers['Authorization'] = `Bearer ${t}`;

        fetch(`http://localhost:8000/api/referentiel/couches/${c.id}/geojson/`, { headers })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.features) {
              setGeoJsonData(prev => ({ ...prev, [c.id]: data }));
            }
          })
          .catch(() => {});
      }
    });
  }, [serverCouches, layerVis, subVis, token, geoJsonData]);

  const selectParcel = (pc) => {
    setSelectedParcel(pc);
    setParcCardVisible(true);
  };

  // Expose map tools to child views
  useEffect(() => {
    window.__map = { 
      zoomTo: (lat, lng, zoom) => mapRef && mapRef.setView([lat, lng], zoom),
      zoomBy: (f) => mapRef && mapRef.setZoom(mapRef.getZoom() + (f < 1 ? 1 : -1)),
      resetView: () => mapRef && mapRef.setView([28.98, -9.99], 9),
      selectParcel, setHitIds, setLayerVis, setSubVis, setCatVis, setCarOpacity, 
    };
    
    if (mapRef) {
      const timer = setTimeout(() => {
        mapRef.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [mapRef, selectParcel, setLayerVis, setSubVis, setCatVis, setCarOpacity]);

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f0f0f0' }}>
      <MapContainer 
        center={[28.98, -9.99]} // Guelmim
        zoom={9}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        ref={setMapRef}
        attributionControl={false}
        zoomControl={false} // We use custom MapNavControls instead
        zoomSnap={0.5}
      >
        {/* M1-01: Navigation controls */}
        <MapNavControls />
        
        {/* M1-02: Coordinate display */}
        <CoordinateDisplay />
        
        {/* M1-07: Measure tools */}
        <MeasureTools />
        
        {/* M1-05: Swipe comparison */}
        <SwipeControl />

        {/* M1-03: Fonds de plan commutables */}
        {layerVis.esri && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri"
          />
        )}
        {layerVis.osm && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        )}
        {layerVis.topo && (
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenTopoMap"
          />
        )}
        {layerVis.neutre && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; CARTO"
          />
        )}
        {/* Fallback: show OSM if no basemap is active */}
        {!layerVis.esri && !layerVis.osm && !layerVis.topo && !layerVis.neutre && (
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        )}

        {/* Dynamic layers from server */}
        {serverCouches
          .filter(c => c.statut === 'validee' || c.statut === 'opposable')
          .filter(isLayerVisible)
          .map(c => {
            const geojson = geoJsonData[c.id];
            if (!geojson) return null;

            const th = c.thematique || '';
            const txt = (c.nom_technique || '').toLowerCase() + ' ' + (c.nom_affichage || '').toLowerCase();
            let color = '#e65100'; let weight = 2; let fillOpacity = 0.4; let dashArray = null;

            if (th === 'communes' || txt.includes('commune')) { color = '#546e7a'; fillOpacity = 0.1; }
            else if (th === 'provinces' || txt.includes('province')) { color = '#37474f'; fillOpacity = 0.05; }
            else if (th === 'regions' || txt.includes('region') || txt.includes('région')) { color = '#263238'; fillOpacity = 0; weight = 3; }
            else if (th === 'car_a') { color = '#2e7d32'; fillOpacity = carOpacity; weight = 1; }
            else if (th === 'car_b') { color = '#8bc34a'; fillOpacity = carOpacity; weight = 1; }
            else if (th === 'car_c') { color = '#fdd835'; fillOpacity = carOpacity; weight = 1; }
            else if (th === 'sols') { color = '#a1887f'; }
            else if (th === 'oued') { color = '#1e88e5'; weight = 3; fillOpacity = 0.85; }
            else if (th === 'eau_forage') { color = '#0d47a1'; }
            else if (th === 'eau_puits') { color = '#4fc3f7'; }
            else if (th === 'eau_source') { color = '#00897b'; }
            else if (th === 'gh') { color = '#00838f'; fillOpacity = 0; dashArray = '7, 4'; }
            else if (th === 'pmh') { color = '#26a69a'; fillOpacity = 0; dashArray = '4, 3'; }
            else if (th === 'ppp') { color = '#7e57c2'; fillOpacity = 0; dashArray = '5, 5'; }
            else if (th === 'priv') { color = '#01579b'; fillOpacity = 1; }
            else if (th === 'nappes') { color = '#64b5f6'; fillOpacity = 0.3; }
            else if (th === 'pei') { color = '#00acc1'; fillOpacity = 0; dashArray = '2, 2'; }
            else if (th === 'oasis') { color = '#00695c'; fillOpacity = 0; weight = 2.5; }
            else if (th === 'past') { color = '#d7ccc8'; }
            else if (th === 'proj_p1') { color = '#1b5e20'; }
            else if (th === 'proj_p2') { color = '#ef6c00'; }
            else if (th === 'proj_mca') { color = '#37474f'; }
            else if (th === 'proj_pmvb') { color = '#6d4c41'; }
            else if (th === 'proj_pam') { color = '#8d6e63'; fillOpacity = 0; }
            else if (th === 'urb') { color = '#9e9e9e'; fillOpacity = 0.75; }
            else if (th === 'ra') { color = '#bdbdbd'; fillOpacity = 0.5; dashArray = '6, 3'; }
            else if (th === 'ocs') { color = '#c0ca33'; }
            else if (th === 'bati') { color = '#424242'; fillOpacity = 1; }
            else if (th === 'tf') { color = '#e53935'; fillOpacity = 0; dashArray = '3, 3'; }
            else if (th === 'stat_melk') { color = '#e57373'; fillOpacity = 0.45; }
            else if (th === 'stat_coll') { color = '#9575cd'; fillOpacity = 0.45; }
            else if (th === 'stat_hab') { color = '#ffb74d'; fillOpacity = 0.45; }
            else if (th === 'stat_dom') { color = '#4db6ac'; fillOpacity = 0.45; }

            const baseStyle = { color, weight, fillOpacity, fillColor: color, dashArray };

            const styleFunc = (feature) => {
              if (feature.properties && feature.properties.occ && th === 'ocs') {
                const OCSCOL = { 'Cultures annuelles': '#cddc39', 'Arboriculture': '#8bc34a', 'Parcours': '#d7ccc8', 'Nu': '#eeeeee' };
                if (OCSCOL[feature.properties.occ]) return { ...baseStyle, fillColor: OCSCOL[feature.properties.occ], color: '#fff', weight: 1 };
              }
              return baseStyle;
            };

            return (
              <GeoJSON 
                key={c.id} 
                data={geojson} 
                style={styleFunc}
                onEachFeature={(feature, layer) => {
                  if (th.includes('car')) {
                    layer.on({
                      click: (e) => {
                        L.DomEvent.stopPropagation(e);
                        selectParcel(feature.properties);
                      }
                    });
                  }
                }}
              />
            );
          })
        }

        {/* Localized Feature */}
        <LocalizedFeatureRenderer feature={localizedFeature} />
      </MapContainer>

      {/* Sim banner */}
      {simActive && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: '20px',
            boxShadow: '0 4px 16px rgba(123,31,162,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            letterSpacing: '0.3px',
          }}
        >
          <span style={{ fontSize: '14px' }}>⚠️</span>
          SCÉNARIO AMC SIMULÉ — la CAR opposable reste le référentiel validé
        </div>
      )}

      {/* M1-08: Parcel information card */}
      {parcCardVisible && selectedParcel && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '60px',
            width: '280px',
            zIndex: 1000,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '16px',
            fontSize: '12px',
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0b3d23', margin: 0, flex: 1, fontFamily: 'Outfit, sans-serif' }}>
              {selectedParcel.id || selectedParcel.orig_id || selectedParcel.OBJECTID || 'Entité'}
            </h4>
            {selectedParcel.cat && (
              <span
                style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'white',
                  background:
                    selectedParcel.cat === 'A' ? '#2e7d32' :
                    selectedParcel.cat === 'B' ? '#8bc34a' :
                    '#fdd835',
                  letterSpacing: '0.5px',
                }}
              >
                CAR-{selectedParcel.cat}
              </span>
            )}
          </div>

          {/* Info rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {selectedParcel.com && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096', fontSize: '11px' }}>Commune</span>
                <b style={{ color: '#1a202c', fontSize: '11px' }}>{selectedParcel.com}</b>
              </div>
            )}
            {selectedParcel.tf && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096', fontSize: '11px' }}>Titre foncier</span>
                <b style={{ color: '#1a202c', fontSize: '11px' }}>{selectedParcel.tf}</b>
              </div>
            )}
            {selectedParcel.statut && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096', fontSize: '11px' }}>Statut</span>
                <b style={{ color: '#1a202c', fontSize: '11px' }}>{selectedParcel.statut}</b>
              </div>
            )}
            {selectedParcel.surf !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096', fontSize: '11px' }}>Superficie</span>
                <b style={{ color: '#1a202c', fontSize: '11px' }}>{Number(selectedParcel.surf).toLocaleString('fr-FR')} ha</b>
              </div>
            )}
            {selectedParcel.occ && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#718096', fontSize: '11px' }}>Occupation</span>
                <b style={{ color: '#1a202c', fontSize: '11px', textAlign: 'right' }}>{selectedParcel.occ}</b>
              </div>
            )}
            
            {/* Additional properties */}
            {Object.entries(selectedParcel)
              .filter(([k,v]) => !['id', 'orig_id', 'OBJECTID', 'cat', 'com', 'tf', 'statut', 'surf', 'occ'].includes(k) && v != null)
              .slice(0, 4)
              .map(([k, v]) => (
                <div style={{ display: 'flex', justifyContent: 'space-between' }} key={k}>
                  <span style={{ color: '#718096', fontSize: '11px' }}>{k}</span>
                  <b style={{ color: '#1a202c', fontSize: '11px', textAlign: 'right', wordBreak: 'break-all', maxWidth: '140px' }}>{String(v).substring(0, 40)}</b>
                </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
            <button
              onClick={() => go('instr')}
              style={{
                flex: 1,
                padding: '6px 0',
                background: 'linear-gradient(135deg, #1b7a45 0%, #22924f 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              🧾 Instruire
            </button>
            <button
              onClick={() => followParcel(selectedParcel.id)}
              style={{
                padding: '6px 10px',
                background: '#f7fafc',
                color: '#4a5568',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              📌
            </button>
            <button
              onClick={() => setParcCardVisible(false)}
              style={{
                padding: '6px 10px',
                background: 'transparent',
                color: '#a0aec0',
                border: 'none',
                borderRadius: '8px',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
