import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Layers, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { CARBadge } from '../ui/ui';

const THEME_GROUPS = [
  {
    name: 'Classification CAR',
    keys: ['car_a', 'car_b', 'car_c'],
    render: (layerVis, catVis, setLayerVis, setCatVis) => (
      <>
        <label className="flex items-center gap-2.5 px-5 py-1.5 hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" className="rounded accent-[#1b7a45]" checked={layerVis.car} onChange={e => setLayerVis(p => ({ ...p, car: e.target.checked }))} />
          <span className="text-xs font-semibold text-gray-800 flex-1">Couche Principale CAR</span>
        </label>
        <div className="pl-6 space-y-1 mt-1 mb-2">
          <label className="flex items-center gap-2.5 px-5 py-1 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="rounded accent-[#1b7a45]" disabled={!layerVis.car} checked={catVis.A} onChange={e => setCatVis(p => ({ ...p, A: e.target.checked }))} />
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'var(--catA)' }} />
            <span className={`text-xs ${!layerVis.car ? 'text-gray-400' : 'text-gray-700'}`}>CAR A — Excellente</span>
          </label>
          <label className="flex items-center gap-2.5 px-5 py-1 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="rounded accent-[#1b7a45]" disabled={!layerVis.car} checked={catVis.B} onChange={e => setCatVis(p => ({ ...p, B: e.target.checked }))} />
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'var(--catB)' }} />
            <span className={`text-xs ${!layerVis.car ? 'text-gray-400' : 'text-gray-700'}`}>CAR B — Bonne</span>
          </label>
          <label className="flex items-center gap-2.5 px-5 py-1 hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" className="rounded accent-[#1b7a45]" disabled={!layerVis.car} checked={catVis.C} onChange={e => setCatVis(p => ({ ...p, C: e.target.checked }))} />
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: 'var(--catC)' }} />
            <span className={`text-xs ${!layerVis.car ? 'text-gray-400' : 'text-gray-700'}`}>CAR C — À améliorer</span>
          </label>
        </div>
      </>
    )
  },
  {
    name: 'Délimitations Administratives',
    items: [
      { id: 'communes', label: 'Communes', color: '#546e7a' },
      { id: 'provinces', label: 'Provinces', color: '#37474f' },
      { id: 'regions', label: 'Régions', color: '#263238' },
    ]
  },
  {
    name: 'Ressources en Eau',
    items: [
      { id: 'oued', label: 'Oueds', color: '#1e88e5' },
      { id: 'nappes', label: 'Nappes souterraines', color: '#64b5f6' },
      { id: 'eau', label: 'Points d\'eau (Forage/Puits)', color: '#0d47a1' },
      { id: 'gh', label: 'Grande Hydraulique', color: '#00838f' },
      { id: 'pmh', label: 'Petite et Moyenne Hydrauli.', color: '#26a69a' },
    ]
  },
  {
    name: 'Occupation & Sols',
    items: [
      { id: 'ocs', label: 'Occupation du sol (OCS)', color: '#c0ca33' },
      { id: 'sols', label: 'Pédologie (Sols)', color: '#a1887f' },
      { id: 'past', label: 'Parcours pastoraux', color: '#d7ccc8' },
      { id: 'oasis', label: 'Oasis', color: '#00695c' },
    ]
  },
  {
    name: 'Foncier & Statut',
    items: [
      { id: 'tf', label: 'Titres Fonciers', color: '#e53935' },
      { id: 'stat', label: 'Statut Foncier', color: '#ab47bc' },
      { id: 'urb', label: 'Périmètre urbain', color: '#9e9e9e' },
      { id: 'bati', label: 'Bâti', color: '#424242' },
      { id: 'ra', label: 'Réforme Agraire', color: '#bdbdbd' },
    ]
  },
  {
    name: 'Aménagements & Projets',
    items: [
      { id: 'proj', label: 'Projets (Pilier I, II, etc.)', color: '#ef6c00' },
      { id: 'pei', label: 'PEI', color: '#00acc1' },
      { id: 'ppp', label: 'Partenariat Public Privé', color: '#7e57c2' },
      { id: 'priv', label: 'Privé', color: '#01579b' },
    ]
  },
  {
    name: 'Fonds de carte',
    items: [
      { id: 'esri', label: 'Imagerie satellite (Esri)', color: '#555555' },
      { id: 'osm', label: 'OpenStreetMap', color: '#aaaaaa' },
      { id: 'topo', label: 'Fond topographique', color: '#8d6e63' },
      { id: 'neutre', label: 'Fond neutre (Positron)', color: '#e0e0e0' },
    ]
  }
];

export default function CarteView() {
  const { layerVis, setLayerVis, subVis, setSubVis, catVis, setCatVis, carOpacity, setCarOpacity, setMapContainer } = useApp();
  
  const [openGroups, setOpenGroups] = useState(THEME_GROUPS.reduce((acc, g, i) => ({ ...acc, [i]: true }), {}));
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchLayer, setSearchLayer] = useState('');

  const toggleGroup = (i) => setOpenGroups(p => ({ ...p, [i]: !p[i] }));

  const BASEMAP_IDS = ['esri', 'osm', 'topo', 'neutre'];

  const toggleLayer = (id) => {
    if (BASEMAP_IDS.includes(id)) {
      // Basemaps are radio: set the selected one, unset others
      setLayerVis(p => {
        const updated = { ...p };
        BASEMAP_IDS.forEach(bm => { updated[bm] = (bm === id); });
        return updated;
      });
    } else {
      setLayerVis(p => ({ ...p, [id]: !p[id] }));
    }
  };

  const isChecked = (id) => {
    if (BASEMAP_IDS.includes(id)) {
      return layerVis[id] === true;
    }
    return layerVis[id] === true;
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      {/* Sidebar - Layer Panel */}
      <div className={`${panelOpen ? 'w-80' : 'w-0'} shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden transition-all duration-200 z-10 shadow-sm relative`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[#1b7a45]" />
            <span className="font-semibold text-sm text-gray-900">Couches SIG</span>
          </div>
          <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-100 bg-white">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchLayer}
              onChange={e => setSearchLayer(e.target.value)}
              placeholder="Filtrer les couches…"
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#1b7a45] bg-gray-50"
            />
          </div>
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto scroll-area py-2">
          {THEME_GROUPS.map((group, gi) => {
            if (searchLayer && group.name.toLowerCase().indexOf(searchLayer.toLowerCase()) === -1) {
              if (!group.items?.some(i => i.label.toLowerCase().includes(searchLayer.toLowerCase()))) return null;
            }

            return (
              <div key={gi} className="border-b border-gray-50 last:border-0">
                <button
                  onClick={() => toggleGroup(gi)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 hover:bg-gray-50 transition-colors"
                >
                  {openGroups[gi] ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
                  <span className="text-xs font-semibold text-gray-700 flex-1 text-left">{group.name}</span>
                </button>
                
                {openGroups[gi] && (
                  <div className="pb-1">
                    {group.render && group.render(layerVis, catVis, setLayerVis, setCatVis)}
                    
                    {group.items && group.items.filter(l => l.label.toLowerCase().includes(searchLayer.toLowerCase())).map((layer) => (
                      <label key={layer.id} className="flex items-center gap-2.5 px-5 py-1.5 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked(layer.id)}
                          onChange={() => toggleLayer(layer.id)}
                          className="rounded accent-[#1b7a45]"
                        />
                        <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: layer.color }} />
                        <span className="text-xs text-gray-700 flex-1">{layer.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="px-5 py-4">
             <label className="text-xs font-semibold text-gray-600 mb-2 block">Opacité CAR</label>
             <input type="range" min="0" max="1" step="0.05" value={carOpacity} onChange={e => setCarOpacity(parseFloat(e.target.value))} className="w-full accent-[#1b7a45]" />
          </div>
        </div>

        {/* M1-04: Légende dynamique conforme au code couleurs opposable */}
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Légende CAR</p>
          {/* CAR categories — TDR colors: A vert foncé, B vert clair, C jaune */}
          {layerVis.car && catVis.A && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-4 h-2 rounded-sm shrink-0" style={{ background: '#2e7d32' }} />
              <span className="text-[11px] text-gray-600 font-medium">Classe A — Haute aptitude</span>
            </div>
          )}
          {layerVis.car && catVis.B && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-4 h-2 rounded-sm shrink-0" style={{ background: '#8bc34a' }} />
              <span className="text-[11px] text-gray-600 font-medium">Classe B — Aptitude moyenne</span>
            </div>
          )}
          {layerVis.car && catVis.C && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-4 h-2 rounded-sm shrink-0" style={{ background: '#fdd835' }} />
              <span className="text-[11px] text-gray-600 font-medium">Classe C — Faible aptitude</span>
            </div>
          )}
          {/* Hors classement */}
          {layerVis.car && (
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-4 h-2 rounded-sm shrink-0" style={{ background: 'repeating-linear-gradient(45deg, #e0e0e0, #e0e0e0 2px, #fff 2px, #fff 4px)' }} />
              <span className="text-[11px] text-gray-400">Hors classement</span>
            </div>
          )}
          {/* Dynamic legend for other active layers */}
          {!layerVis.car && (
            <p className="text-[10px] text-gray-400 italic">Activez la couche CAR pour afficher la légende</p>
          )}
          {/* Active thematic layers indicator */}
          {(layerVis.oued || layerVis.eau || layerVis.gh || layerVis.pmh) && (
            <>
              <div className="h-px bg-gray-200 my-2" />
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Ressources en eau</p>
              {layerVis.oued && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-0.5 rounded shrink-0" style={{ background: '#1e88e5' }} />
                  <span className="text-[10px] text-gray-500">Oueds</span>
                </div>
              )}
              {layerVis.gh && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-2 rounded-sm shrink-0 border border-dashed" style={{ borderColor: '#00838f', background: 'transparent' }} />
                  <span className="text-[10px] text-gray-500">Grande Hydraulique</span>
                </div>
              )}
              {layerVis.pmh && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-4 h-2 rounded-sm shrink-0 border border-dashed" style={{ borderColor: '#26a69a', background: 'transparent' }} />
                  <span className="text-[10px] text-gray-500">PMH</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full bg-[#e5e5e5]">
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute left-3 top-3 z-[1001] bg-white rounded-lg shadow p-2 hover:bg-gray-50 border border-gray-200"
          >
            <Layers size={14} className="text-[#1b7a45]" />
          </button>
        )}
        {/* Leaflet portal target */}
        <div className="mapSlot w-full h-full absolute inset-0" ref={setMapContainer}></div>
      </div>
    </div>
  );
}
