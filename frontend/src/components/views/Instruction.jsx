import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SCORES, CRIT } from '../../data/parcels';
import { DOCSURB } from '../../data/communes';
import { ChevronDown, ChevronRight, CheckCircle, AlertTriangle, Info, Save, Printer, FileText, MapPin } from 'lucide-react';
import { Card, CARBadge, Badge, Button, Input, Select } from '../ui/ui';
import { useNavigate } from 'react-router-dom';

const sections = [
  { id: 'identity', label: '1. Identification de la Parcelle', icon: <FileText size={14} /> },
  { id: 'owner', label: '2. Informations Propriétaire', icon: <Info size={14} /> },
  { id: 'physical', label: '3. Caractéristiques Physiques', icon: <AlertTriangle size={14} /> },
  { id: 'agro', label: '4. Vocation Agropastorale', icon: <CheckCircle size={14} /> },
  { id: 'infra', label: '5. Infrastructure & Équipements', icon: <CheckCircle size={14} /> },
  { id: 'car', label: '6. Classification CAR Proposée', icon: <CheckCircle size={14} /> },
  { id: 'advisory', label: '7. Avis Technique & Recommandations', icon: <Info size={14} /> },
];

export default function Instruction() {
  const { selectedParcel: pc, simActive, doExport, toast, setMapContainer } = useApp();
  const navigate = useNavigate();

  const [openSections, setOpenSections] = useState(new Set(['identity', 'car', 'advisory']));
  const [carClass, setCarClass] = useState(pc ? (simActive && pc.simCat ? pc.simCat : pc.cat) : 'A');

  if (!pc) {
    return (
      <div className="flex w-full h-full">
        <div className="w-[500px] shrink-0 bg-white border-r border-gray-100 p-8 flex flex-col justify-center text-center z-10 shadow-sm relative">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucune parcelle sélectionnée</h2>
          <p className="text-sm text-gray-500 mb-6">Sélectionnez une unité sur la carte ou utilisez le module de localisation.</p>
          <div className="flex flex-col gap-3">
            <Button variant="primary" onClick={() => navigate('/localiser')}>Localiser une parcelle</Button>
            <Button variant="outline" onClick={() => navigate('/carte')}>Ouvrir la carte</Button>
          </div>
        </div>
        <div className="flex-1 relative z-0">
          <div className="mapSlot w-full h-full absolute inset-0" ref={setMapContainer}></div>
        </div>
      </div>
    );
  }

  function toggle(id) {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const s = SCORES[pc.id] || { sol: 0, eau: 0, clim: 0, occ: 0, cont: 0 };
  let total = 0;
  const w = {};
  CRIT.forEach(c => { w[c[0]] = c[2]; total += c[2]; });
  CRIT.forEach(c => w[c[0]] /= total);
  const ipa = CRIT.reduce((t, c) => t + w[c[0]] * s[c[0]], 0);
  
  const cat = (simActive && pc.simCat) ? pc.simCat : pc.cat;
  
  const dE = 0;
  const chev = false;
  const avis = cat === 'A' ? 'Avis technique favorable — CAR Classe A'
    : cat === 'B' ? 'Instruction au cas par cas — CAR Classe B'
    : 'A priori compatible — CAR Classe C';

  return (
    <div className="flex w-full h-full">
      {/* Synoptic panel */}
      <div className="w-[600px] shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto scroll-area p-5 space-y-3 z-10 shadow-sm relative">
        {/* Header */}
        <div className="bg-[#0b3d23] rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-green-300 text-xs font-medium">Fiche Synoptique d'Instruction</p>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: 'Outfit, sans-serif' }}>{pc.id}</h2>
            <p className="text-green-300 text-sm mt-0.5">Campagne 2025/2026 · {pc.tf}</p>
          </div>
          <div className="flex items-center gap-3">
            <CARBadge cat={cat} />
            <Badge color="green">Instruction</Badge>
          </div>
        </div>

        {simActive && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-xs">
            ⚠️ Scénario AMC simulé actif — les valeurs officielles restent celles de la CAR validée.
          </div>
        )}

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Avancement de l'instruction</span>
            <span className="text-sm font-bold text-[#1b7a45]">5/7 sections complètes</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-[#1b7a45] rounded-full" style={{ width: '71%' }} />
          </div>
          <div className="flex gap-1 mt-2">
            {sections.map((sec, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < 5 ? 'bg-[#1b7a45]' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        {/* Sections */}
        {sections.map(sec => (
          <Card key={sec.id} className="overflow-hidden">
            <button
              onClick={() => toggle(sec.id)}
              className="flex items-center gap-3 w-full p-4 hover:bg-gray-50 transition-colors"
            >
              {openSections.has(sec.id) ? <ChevronDown size={15} className="text-[#1b7a45]" /> : <ChevronRight size={15} className="text-gray-400" />}
              <span className="text-sm font-semibold text-gray-900 flex-1 text-left">{sec.label}</span>
              {sec.id !== 'infra' && sec.id !== 'advisory' ? (
                <CheckCircle size={15} className="text-[#4caf50]" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
              )}
            </button>

            {openSections.has(sec.id) && (
              <div className="px-5 pb-5 border-t border-gray-50">
                {sec.id === 'identity' && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Input label="Références" value={`${pc.id} · ${pc.tf}`} disabled />
                    <Input label="Superficie (ha)" value={pc.surf.toLocaleString('fr-FR')} disabled />
                    <Input label="Commune" value={pc.com} disabled />
                    <Input label="Statut foncier" value={pc.statut || 'N/A'} disabled />
                  </div>
                )}

                {sec.id === 'owner' && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Input label="Raison sociale / Nom" value="A renseigner..." />
                    <Input label="N° CIN / RC" value="" />
                    <Select label="Type de propriété" value="private" onChange={() => {}} options={[
                      { value: 'private', label: 'Privée individuelle' },
                      { value: 'collective', label: 'Collective / Coopérative' },
                      { value: 'state', label: 'Domaniale' },
                    ]} />
                  </div>
                )}

                {sec.id === 'physical' && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Input label="Unité pédologique" value={pc.sol || 'N/A'} disabled />
                    <Input label="Chevauchement zonage" value={chev ? 'OUI' : 'NON'} disabled />
                    <Input label="Score Sol" value={s.sol} disabled />
                    <Input label="Score Contraintes" value={s.cont} disabled />
                  </div>
                )}

                {sec.id === 'agro' && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Input label="Occupation actuelle" value={pc.occ || 'N/A'} disabled />
                    <Input label="Score Bioclimat" value={s.clim} disabled />
                    <Input label="Score Occupation" value={s.occ} disabled />
                    <Input label="IPA (Composite)" value={ipa.toFixed(2)} disabled />
                  </div>
                )}

                {sec.id === 'infra' && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Input label="Point d'eau le plus proche" value={`${Math.round(dE).toLocaleString('fr-FR')} m`} disabled />
                    <Input label="Profondeur nappe" value={pc.nappe || 'N/A'} disabled />
                    <Input label="Score Eau" value={s.eau} disabled />
                  </div>
                )}

                {sec.id === 'car' && (
                  <div className="pt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {['A', 'B', 'C'].map(c => (
                        <button
                          key={c}
                          onClick={() => setCarClass(c)}
                          className={`p-4 rounded-xl border-2 text-center transition-all ${
                            carClass === c
                              ? c === 'A' ? 'border-[#4caf50] bg-[#e8f5e9]'
                              : c === 'B' ? 'border-[#ff9800] bg-[#fff3e0]'
                              : 'border-[#f44336] bg-[#ffebee]'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <CARBadge cat={c} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sec.id === 'advisory' && (
                  <div className="pt-4 space-y-4">
                    <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <CheckCircle size={15} className="text-[#2e7d32] mt-0.5" />
                        <p className="text-sm font-semibold text-[#1b4620]">{avis}</p>
                      </div>
                      <p className="text-sm text-[#2e7d32] leading-relaxed">
                        Avis indicatif au regard de la CAR, sans préjudice de l'instruction réglementaire des demandes.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Side summary */}
      <div className="w-64 shrink-0 bg-white border-r border-gray-100 p-4 flex flex-col gap-4 overflow-y-auto scroll-area z-10 shadow-sm relative">
        <h3 className="font-bold text-sm text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Résumé</h3>

        <div className="space-y-2 text-xs">
          {[
            { l: 'Parcelle', v: pc.id },
            { l: 'Titre Foncier', v: pc.tf },
            { l: 'Superficie', v: `${pc.surf} ha` },
            { l: 'Commune', v: pc.com },
            { l: 'Statut', v: pc.statut || 'N/A' },
            { l: 'Occupation', v: pc.occ || 'N/A' },
          ].map(item => (
            <div key={item.l} className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-400">{item.l}</span>
              <span className="text-gray-700 font-medium text-right">{item.v}</span>
            </div>
          ))}
          <div className="flex justify-between py-1">
            <span className="text-gray-400">Classe CAR</span>
            <CARBadge cat={carClass} />
          </div>
        </div>

        <div className="space-y-2">
          <Button variant="primary" size="sm" className="w-full" icon={<Save size={13} />} onClick={() => toast("Dossier de dérogation enregistré.")}>Enregistrer</Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            icon={<Printer size={13} />} 
            onClick={async () => {
              if (pc.id && pc.id.startsWith('UCA-')) {
                // Appel au backend
                toast('Génération du PDF en cours...');
                try {
                  const res = await fetch(`http://localhost:8000/api/classement/unitecarteagricole/${pc.id.replace('UCA-', '')}/fiche_pdf/`);
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Fiche_Synoptique_${pc.id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    toast('✅ PDF généré avec succès.');
                  } else {
                    toast('⚠️ Génération mockée (ID introuvable en base).');
                    doExport('Fiche synoptique ' + pc.id);
                  }
                } catch(e) {
                  doExport('Fiche synoptique ' + pc.id);
                }
              } else {
                doExport('Fiche synoptique ' + pc.id);
              }
            }}
          >
            Imprimer PDF
          </Button>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-0 bg-[#e5e5e5] h-full">
        <div className="mapSlot w-full h-full absolute inset-0" ref={setMapContainer}></div>
      </div>
    </div>
  );
}
