import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CATALOG, STATLBL } from '../../data/catalog';
import ImportCouche from './ImportCouche';
import CoucheDetailModal from './CoucheDetailModal';
import { Search, Download, Info, Database, Globe, Check, X, FileText, Trash2, Edit3, ShieldCheck, FolderTree, ChevronRight } from 'lucide-react';
import { Card, Badge, Button, Input, Select } from '../ui/ui';

export default function Catalogue() {
  const { toast, token, profile, serverCouches, loadServerCouches } = useApp();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  
  const [showImport, setShowImport] = useState(false);
  const [detailModal, setDetailModal] = useState(null);

  const canEdit = profile === 'editeur';
  const isAdmin = profile === 'admin';

  const openDetail = (couche, isServer, initialTab = 'info') => {
    setDetailModal({ couche, isServer, initialTab });
  };

  const handleValidate = async (coucheId, nomCouche) => {
    if (!isAdmin) {
      toast("❌ Seul un Administrateur peut valider une couche.");
      return;
    }
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/valider/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast(`✅ Couche « ${nomCouche} » validée avec succès ! Elle est désormais publiée.`);
        loadServerCouches();
        setSelected(null);
      } else {
        const err = await res.json();
        toast(`❌ Échec de la validation : ${err.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      toast(`❌ Erreur réseau : ${err.message}`);
    }
  };

  const handleSubmitForValidation = async (coucheId, nomCouche) => {
    if (!canEdit && !isAdmin) {
      toast("❌ Action non autorisée.");
      return;
    }
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/soumettre/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast(`✅ Couche « ${nomCouche} » soumise à validation.`);
        loadServerCouches();
        setSelected(null);
      } else {
        const err = await res.json();
        toast(`❌ Échec de la soumission : ${err.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      toast(`❌ Erreur réseau : ${err.message}`);
    }
  };

  const handleReject = async (coucheId, nomCouche) => {
    if (!isAdmin) {
      toast("❌ Action non autorisée.");
      return;
    }
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/rejeter/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast(`⚠️ Couche « ${nomCouche} » rejetée (retournée à l'état Brouillon).`);
        loadServerCouches();
        setSelected(null);
      } else {
        const err = await res.json();
        toast(`❌ Échec du rejet : ${err.error || 'Erreur inconnue'}`);
      }
    } catch (err) {
      toast(`❌ Erreur réseau : ${err.message}`);
    }
  };

  const handleDelete = async (coucheId, nomCouche) => {
    if (profile !== 'admin' && profile !== 'editeur') {
      toast("❌ Action non autorisée.");
      return;
    }
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok || res.status === 204) {
        toast(`🗑️ Couche « ${nomCouche} » supprimée.`);
        loadServerCouches();
        setSelected(null);
      } else {
        toast(`❌ Échec de la suppression.`);
      }
    } catch (err) {
      toast(`❌ Erreur réseau : ${err.message}`);
    }
  };

  // Map serverCouches to Figma format
  const serverLayers = serverCouches.map(c => ({
    id: `srv-${c.id}`,
    rawId: c.id,
    name: c.nom_affichage || c.nom_technique,
    type: `Vecteur — ${c.type_geometrie}`,
    format: 'PostGIS',
    crs: `EPSG:${c.srid}`,
    scale: 'Variable',
    date: c.date_creation ? new Date(c.date_creation).toLocaleDateString() : '-',
    updated: c.date_modification ? new Date(c.date_modification).toLocaleDateString() : '-',
    owner: c.auteur_nom || 'Inconnu',
    size: 'N/A',
    records: null,
    iso: '19115',
    open: c.statut === 'validee' || c.statut === 'opposable',
    statut: c.statut,
    tags: [c.thematique, c.statut],
    desc: `Source : ${c.source || 'PostGIS'}`,
    raw: c,
    isMock: false
  }));

  // Map CATALOG to Figma format
  const mockLayers = CATALOG.filter(r => r[4] !== 'attente' && r[4] !== 'brouillon').map((r, i) => ({
    id: `mock-${i}`,
    name: r[0],
    type: r[2] === 'base' ? 'Vecteur' : 'Dérivée',
    format: 'Shapefile / Raster',
    crs: 'EPSG:26192',
    scale: '1:50 000',
    date: r[5],
    updated: r[5],
    owner: 'Catalogue interne',
    size: 'N/A',
    records: null,
    iso: '19115',
    open: r[4] === 'validee' || r[4] === 'opposable',
    statut: r[4],
    tags: [r[1], STATLBL[r[4]][0]],
    desc: `Source : ${r[3]}`,
    raw: r,
    isMock: true
  }));

  const allLayers = [...serverLayers, ...mockLayers];
  
  // Sorting: Pending validation first, then alphabetical
  allLayers.sort((a, b) => {
    const aPending = a.statut === 'brouillon' || a.statut === 'soumise';
    const bPending = b.statut === 'brouillon' || b.statut === 'soumise';
    if (aPending && !bPending) return -1;
    if (!aPending && bPending) return 1;
    return a.name.localeCompare(b.name);
  });

  const filtered = allLayers.filter(l =>
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) &&
    (typeFilter === 'all' || (typeFilter === 'vector' ? l.type.includes('Vecteur') : l.type.includes('Raster') || l.type.includes('Dérivée')))
  );

  return (
    <div className="flex w-full h-full relative">
      {/* Catalog list */}
      <div className="flex-1 p-5 overflow-y-auto scroll-area space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Catalogue de Données SIG</h1>
            <p className="text-sm text-gray-500">{allLayers.length} couches disponibles · Standard ISO 19115</p>
          </div>
          {canEdit && (
            <Button variant="primary" onClick={() => setShowImport(true)}>
              ➕ Importer une couche
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <Input value={search} onChange={setSearch} placeholder="Rechercher dans le catalogue…" icon={<Search size={13} />} className="flex-1" />
          <Select value={typeFilter} onChange={setTypeFilter} options={[
            { value: 'all', label: 'Tous les types' },
            { value: 'vector', label: 'Vecteur' },
            { value: 'raster', label: 'Raster / Dérivée' },
          ]} className="w-44" />
        </div>

        {/* Results — Arborescence 3 niveaux (M3-01) */}
        <div className="space-y-4">
          {Object.entries(
            filtered.reduce((acc, layer) => {
              const isPending = layer.statut === 'brouillon' || layer.statut === 'soumise';
              let dom, sdom;
              
              if (isPending) {
                dom = '⚠️ EN ATTENTE DE TRAITEMENT';
                sdom = layer.statut === 'soumise' ? 'Soumises à validation' : 'Brouillons';
              } else {
                dom = layer.raw?.domaine || layer.raw?.[1]?.split(' — ')[0] || 'Général';
                sdom = layer.raw?.sous_domaine || layer.raw?.[1]?.split(' — ')[1] || 'Autres';
              }
              
              if (!acc[dom]) acc[dom] = {};
              if (!acc[dom][sdom]) acc[dom][sdom] = [];
              acc[dom][sdom].push(layer);
              return acc;
            }, {})
          ).map(([domaine, sousDomaines]) => (
            <div key={domaine} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <FolderTree size={16} className="text-[#1b7a45]" />
                <h2 className="font-bold text-gray-800 uppercase tracking-wide text-xs">{domaine}</h2>
              </div>
              <div className="p-3 space-y-3">
                {Object.entries(sousDomaines).map(([sousDomaine, couches]) => (
                  <div key={sousDomaine} className="pl-2 border-l-2 border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 pl-2 flex items-center gap-1.5">
                      <ChevronRight size={14} className="text-gray-400" />
                      {sousDomaine} <span className="text-xs text-gray-400 font-normal">({couches.length})</span>
                    </h3>
                    <div className="space-y-2 pl-4">
                      {couches.map(layer => {
                        const isPending = layer.statut === 'brouillon' || layer.statut === 'soumise';
                        return (
                          <Card
                            key={layer.id}
                            className={`p-3 cursor-pointer transition-all hover:border-[#1b7a45]/30 ${selected?.id === layer.id ? 'border-[#1b7a45] bg-[#f0faf4]' : ''} ${isPending ? 'border-amber-200 bg-amber-50/30' : ''}`}
                            onClick={() => setSelected(selected?.id === layer.id ? null : layer)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${layer.type.includes('Vecteur') ? 'bg-[#e8f5e9]' : 'bg-blue-50'}`}>
                                {layer.type.includes('Vecteur') ? <Database size={14} className="text-[#1b7a45]" /> : <Globe size={14} className="text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold text-gray-900 leading-tight">{layer.name}</p>
                                    {layer.statut === 'brouillon' && <Badge color="gray">Brouillon</Badge>}
                                    {layer.statut === 'soumise' && <Badge color="yellow">Attente validation</Badge>}
                                  </div>
                                  <div className="flex gap-1 shrink-0">
                                    {layer.open ? <Badge color="green">Open</Badge> : <Badge color="gray">Restreint</Badge>}
                                    <Badge color="blue">{layer.format.split('/')[0].trim()}</Badge>
                                  </div>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-1">{layer.type} · {layer.crs} · {layer.scale}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 bg-white border-l border-gray-100 overflow-y-auto scroll-area">
          <div className="bg-[#0b3d23] px-5 py-4 flex items-start justify-between">
            <div>
              <p className="text-green-300 text-xs mb-1">Métadonnées ISO 19115</p>
              <p className="text-white font-bold text-sm leading-snug">{selected.name}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-green-300 hover:text-white mt-0.5">
              <X size={14} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">{selected.desc}</p>

            <div className="space-y-2">
              {[
                { label: 'Type de données', value: selected.type },
                { label: 'Format', value: selected.format },
                { label: 'Système', value: selected.crs },
                { label: 'Date', value: selected.date },
                { label: 'Responsable', value: selected.owner },
                { label: 'Statut', value: selected.statut },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  <span className="text-xs text-gray-700 font-medium text-right max-w-[160px]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <Button 
                  variant="primary" 
                  className="flex-1 bg-[#1b7a45] hover:bg-[#145c34]" 
                  size="sm" 
                  icon={<Globe size={13} />}
                  onClick={() => {
                    toast(`Ouverture de la couche « ${selected.name} » sur la carte...`);
                    // Ici on pourrait injecter la couche dans l'état global et rediriger vers la carte
                  }}
                >
                  Ouvrir
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-[#1b7a45] border-[#1b7a45] hover:bg-[#f0faf4]" 
                  size="sm" 
                  icon={<Download size={13} />}
                  onClick={() => toast(`Export de la couche « ${selected.name} » en cours...`)}
                >
                  Exporter
                </Button>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm" 
                icon={<FileText size={13} />}
                onClick={() => openDetail(selected.raw, !selected.isMock, 'meta')}
              >
                Fiche métadonnée complète
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm" 
                icon={<Info size={13} />}
                onClick={() => openDetail(selected.raw, !selected.isMock, 'history')}
              >
                Historique des versions
              </Button>
            </div>

            {/* Admin / Editeur Actions */}
            {!selected.isMock && (selected.statut === 'brouillon' || selected.statut === 'soumise') && (
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-amber-800 mb-2">Actions de contrôle</p>
                
                {selected.statut === 'brouillon' && canEdit && !isAdmin && (
                  <Button 
                    variant="primary" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                    size="sm" 
                    icon={<Check size={13} />}
                    onClick={() => handleSubmitForValidation(selected.rawId, selected.name)}
                  >
                    Soumettre à validation
                  </Button>
                )}
                
                {(selected.statut === 'soumise' || selected.statut === 'brouillon') && isAdmin && (
                  <Button 
                    variant="primary" 
                    className="w-full bg-[#1b7a45] hover:bg-[#145c34]" 
                    size="sm" 
                    icon={<ShieldCheck size={13} />}
                    onClick={() => handleValidate(selected.rawId, selected.name)}
                  >
                    Valider & Publier
                  </Button>
                )}
                
                {selected.statut === 'soumise' && isAdmin && (
                  <Button 
                    variant="outline" 
                    className="w-full text-amber-600 border-amber-200 hover:bg-amber-50" 
                    size="sm" 
                    icon={<X size={13} />}
                    onClick={() => handleReject(selected.rawId, selected.name)}
                  >
                    Rejeter à l'état Brouillon
                  </Button>
                )}
                
                {selected.statut === 'soumise' && canEdit && !isAdmin && (
                  <p className="text-xs text-amber-700 text-center mb-2">En attente de validation administrateur</p>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50" 
                  size="sm" 
                  icon={<Trash2 size={13} />}
                  onClick={() => handleDelete(selected.rawId, selected.name)}
                >
                  Supprimer
                </Button>
              </div>
            )}
            
            {selected.isMock && canEdit && (
              <div className="pt-4 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm" 
                  icon={<Edit3 size={13} />}
                  onClick={() => toast(`Mise à jour de « ${selected.name} » : nouvelle version créée.`)}
                >
                  Mettre à jour
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showImport && (
        <ImportCouche 
          onClose={() => setShowImport(false)} 
          onSuccess={loadServerCouches}
        />
      )}

      {detailModal && (
        <CoucheDetailModal
          couche={detailModal.couche}
          isServer={detailModal.isServer}
          initialTab={detailModal.initialTab}
          onClose={() => setDetailModal(null)}
        />
      )}
    </div>
  );
}
