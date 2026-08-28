import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PARCELS } from '../../data/parcels';
import { COMMUNES, COMMUNES_COORDS } from '../../data/communes';
import proj4 from 'proj4';
import { Search, MapPin, Upload, FileText, Crosshair, Check, ChevronRight } from 'lucide-react';
import { Input, Select, Button, CARBadge, Badge } from '../ui/ui';
import { useNavigate } from 'react-router-dom';

// Define Lambert Maroc Zone Sud (EPSG:26192)
proj4.defs("EPSG:26192", "+proj=lcc +lat_1=29.7 +lat_0=29.7 +lon_0=-5.4 +k_0=0.9996155960000001 +x_0=500000 +y_0=300000 +a=6378249.2 +b=6356515 +towgs84=31,146,47,0,0,0,0 +units=m +no_defs");

const tabs = [
  { id: 'coords', label: 'Coordonnées GPS', icon: <Crosshair size={14} /> },
  { id: 'title', label: 'Titre Foncier', icon: <FileText size={14} /> },
  { id: 'commune', label: 'Commune / Fraction', icon: <MapPin size={14} /> },
  { id: 'upload', label: 'Import Fichier', icon: <Upload size={14} /> },
];

export default function Localiser() {
  const { toast, setSelectedParcel, setLocalizedFeature, setMapContainer } = useApp();
  const navigate = useNavigate();
  
  const [method, setMethod] = useState('coords');
  const [searched, setSearched] = useState(false);
  const [resultHtml, setResultHtml] = useState('');
  const [resultParcel, setResultParcel] = useState(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Form states
  const [coordX, setCoordX] = useState('');
  const [coordY, setCoordY] = useState('');
  const [tfStr, setTfStr] = useState('');
  const [comSelect, setComSelect] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const fileInputRef = React.useRef(null);
  
  const handleSearch = async () => {
    if (method === 'coords') {
      const valX = parseFloat(coordX.replace(/\s/g, '').replace(',', '.'));
      const valY = parseFloat(coordY.replace(/\s/g, '').replace(',', '.'));
      if (isNaN(valX) || isNaN(valY)) { toast('Saisissez des coordonnées valides.'); return; }
      
      let lng, lat, type;
      if (Math.abs(valX) <= 180 && Math.abs(valY) <= 180) {
        type = "WGS84";
        if (valX > 0 && valY < 0) { lat = valX; lng = valY; }
        else if (valY > 0 && valX < 0) { lat = valY; lng = valX; }
        else { lng = valX; lat = valY; }
      } else {
        type = "Lambert";
        [lng, lat] = proj4("EPSG:26192", "EPSG:4326", [valX, valY]);
      }
      
      try {
        const res = await fetch(`http://localhost:8000/api/geodata/localiser/coordonnees/?lat=${lat}&lng=${lng}`);
        const data = await res.json();
        setLocalizedFeature({ type: "Feature", geometry: { type: "Point", coordinates: [lng, lat] }, properties: { label: `Coordonnées ${type}` } });
        setResultHtml(`📍 Repère positionné (WGS84: ${data.wgs84.lat.toFixed(5)}°, ${data.wgs84.lng.toFixed(5)}°). Lambert: X=${data.lambert.x.toFixed(2)}, Y=${data.lambert.y.toFixed(2)}`);
        setResultParcel(null);
        setSearched(true);
      } catch (err) {
        toast('Erreur lors de la localisation.');
      }
      
    } else if (method === 'title') {
      const q = tfStr.replace(/\s/g, '').toLowerCase();
      if (q.length < 2) { toast('Saisissez un titre foncier valide.'); return; }
      
      try {
        const res = await fetch(`http://localhost:8000/api/geodata/localiser/titre-foncier/?tf=${encodeURIComponent(tfStr)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        
        setLocalizedFeature(data.geojson);
        const pc = { id: data.tf, tf: data.tf, com: data.commune, surf: data.superficie_ha, statut: data.statut };
        setSelectedParcel(pc);
        setResultParcel(pc);
        setResultHtml(`✅ TF ${data.tf} localisé — commune de ${data.commune}.`);
        setSearched(true);
      } catch (err) {
        toast('Titre foncier introuvable.');
      }
      
    } else if (method === 'commune') {
      if (!comSelect) { toast('Veuillez sélectionner une commune.'); return; }
      
      try {
        const res = await fetch(`http://localhost:8000/api/geodata/localiser/commune/?nom=${encodeURIComponent(comSelect)}`);
        const data = await res.json();
        setLocalizedFeature(data.geojson);
        setResultHtml(`✅ Commune de ${data.nom} localisée.`);
        setResultParcel(null);
        setSearched(true);
      } catch (err) {
        toast('Erreur de localisation de la commune.');
      }
      
    } else if (method === 'upload') {
      if (!uploadFile) {
        toast('❌ Veuillez d\'abord sélectionner ou glisser un fichier.');
        return;
      }
      
      const fileExt = uploadFile.name.split('.').pop().toLowerCase();
      if (fileExt !== 'geojson' && fileExt !== 'json') {
        toast('⚠️ Seuls les fichiers .geojson sont supportés en natif pour le moment.');
        setResultHtml(`Échec : format .${fileExt} non géré.`);
        return;
      }

      const formData = new FormData();
      formData.append('file', uploadFile);

      try {
        const res = await fetch('http://localhost:8000/api/geodata/localiser/fichier/', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erreur d\'import');
        }
        const data = await res.json();
        setLocalizedFeature(data);
        setResultHtml(`✅ Fichier ${uploadFile.name} importé avec succès. (${data.features ? data.features.length : 1} entité(s))`);
        setSearched(true);
      } catch (err) {
        setResultHtml(`❌ Échec de l'import : ${err.message}`);
        toast(err.message);
      }
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex w-full h-full">
      {/* Left panel */}
      <div className={`${panelOpen ? 'w-[400px]' : 'w-0'} shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto scroll-area transition-all duration-200 z-10 shadow-sm relative`}>
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Localiser une Parcelle</h2>
            <p className="text-xs text-gray-500 mt-0.5">Choisissez une méthode de recherche</p>
          </div>
          <button onClick={() => setPanelOpen(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Method tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-3 border-b border-gray-100 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setMethod(tab.id); setSearched(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                method === tab.id ? 'bg-[#1b7a45] text-white shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div className="p-4 flex-1">
          {method === 'coords' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                Saisissez les coordonnées en Lambert Maroc (EPSG:26192)
              </p>
              <Input label="X (m)" value={coordX} onChange={setCoordX} placeholder="ex: 758 400" icon={<Crosshair size={13} />} />
              <Input label="Y (m)" value={coordY} onChange={setCoordY} placeholder="ex: 131 650" icon={<Crosshair size={13} />} />
            </div>
          )}

          {method === 'title' && (
            <div className="space-y-3">
              <Input label="Numéro de Titre Foncier" value={tfStr} onChange={setTfStr} placeholder="ex: TF 12457/56" icon={<FileText size={13} />} />
              <Select label="Conservation Foncière (filtre optionnel)" value="" onChange={() => {}} options={[
                { value: '', label: 'Toutes les conservations' },
                { value: 'guelmim', label: 'Guelmim' }
              ]} />
            </div>
          )}

          {method === 'commune' && (
            <div className="space-y-3">
              <Select label="Commune" value={comSelect} onChange={setComSelect} options={[
                { value: '', label: 'Choisir une commune' },
                ...COMMUNES.map(c => ({ value: c, label: c }))
              ]} />
            </div>
          )}

          {method === 'upload' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Pour le moment, seul le format <strong className="text-[#1b7a45]">.geojson</strong> est supporté.</p>
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer group ${uploadFile ? 'border-[#1b7a45] bg-[#f0faf4]' : 'border-gray-200 hover:border-[#1b7a45]'}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".geojson,.json"
                  onChange={(e) => e.target.files[0] && setUploadFile(e.target.files[0])} 
                />
                <Upload size={28} className={`mx-auto mb-2 transition-colors ${uploadFile ? 'text-[#1b7a45]' : 'text-gray-300 group-hover:text-[#1b7a45]'}`} />
                {uploadFile ? (
                  <p className="text-sm font-semibold text-[#1b7a45] break-all">{uploadFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-500 group-hover:text-[#1b7a45]">Cliquez ou glissez un fichier .geojson ici</p>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full mt-5"
            icon={<Search size={14} />}
            onClick={handleSearch}
          >
            Rechercher et Localiser
          </Button>
        </div>

        {/* Result panel */}
        {searched && (
          <div className="border-t border-gray-100 bg-[#f0faf4] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check size={14} className="text-[#1b7a45]" />
              <p className="text-xs font-semibold text-[#1b7a45]">Résultat trouvé</p>
            </div>
            
            <p className="text-xs text-gray-700 mb-3">{resultHtml}</p>
            
            {resultParcel && (
              <div className="bg-white rounded-xl p-3 border border-[#c8e6c9] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{resultParcel.tf || resultParcel.id}</span>
                  {resultParcel.cat && <CARBadge cat={resultParcel.cat} />}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-gray-400">Superficie</span><span className="text-gray-700 font-medium">{resultParcel.surf} ha</span>
                  <span className="text-gray-400">Commune</span><span className="text-gray-700">{resultParcel.com}</span>
                  <span className="text-gray-400">Statut</span><Badge color="green">{resultParcel.statut || 'N/A'}</Badge>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="primary" size="sm" className="flex-1" onClick={() => navigate('/instruction')}>Instruire</Button>
                  <Button variant="outline" size="sm">Fiche</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Area */}
      <div className="flex-1 relative h-full bg-[#e5e5e5]">
        {!panelOpen && (
          <button
            onClick={() => setPanelOpen(true)}
            className="absolute left-3 top-3 z-[1001] bg-white rounded-lg shadow p-2 hover:bg-gray-50 border border-gray-200"
          >
            <MapPin size={14} className="text-[#1b7a45]" />
          </button>
        )}
        <div className="mapSlot w-full h-full absolute inset-0 z-0" ref={setMapContainer}></div>
      </div>
    </div>
  );
}
