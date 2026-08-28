import React, { useMemo } from 'react';
import { Star, Clock, Download, Trash2, BarChart2, MapPin, FileText, Calculator, Play } from 'lucide-react';
import { Card, CARBadge, Badge, Button, SectionHeader } from '../ui/ui';
import { useApp } from '../../context/AppContext';
import { PARCELS } from '../../data/parcels';

export default function MonEspace() {
  const { store, setStore, go, toast, doExport, setSelectedParcel } = useApp();

  const delModel = (k, i) => {
    setStore(prev => {
      const ns = { ...prev };
      ns[k] = [...ns[k]];
      ns[k].splice(i, 1);
      return ns;
    });
    toast('✅ Élément supprimé.');
  };

  const followedParcels = useMemo(() => {
    return store.parcels.map(id => PARCELS.find(p => p.id === id)).filter(Boolean);
  }, [store.parcels]);

  return (
    <div className="p-6 overflow-y-auto h-full scroll-area space-y-6" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#0b3d23] to-[#1b7a45] rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-green-300 text-xs font-medium mb-1">Mon Espace de Travail</p>
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>Ahmed Benali</h1>
          <p className="text-green-300 text-sm mt-0.5">Agent Instructeur · DRA Guelmim-Oued Noun</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{followedParcels.length}</p>
            <p className="text-xs text-green-300">Parcelles suivies</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>{store.queries.length + store.amc.length}</p>
            <p className="text-xs text-green-300">Modèles & Requêtes</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3">
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>3</p>
            <p className="text-xs text-green-300">Exports ce mois</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Followed parcels */}
        <Card className="lg:col-span-2 p-5">
          <SectionHeader title="Parcelles Suivies" sub={`${followedParcels.length} parcelle(s) en surveillance active`}
            action={<Button variant="outline" size="sm" icon={<MapPin size={12} />} onClick={() => go('carte')}>Explorer</Button>} />
          
          <div className="space-y-2 mt-4">
            {followedParcels.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune parcelle suivie. Cliquez sur une parcelle sur la carte, puis sur « Suivre » pour l'ajouter.
              </div>
            ) : (
              followedParcels.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors">
                  <Star size={14} className="text-[#c8a13a] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.id} · {p.tf}</p>
                    <p className="text-xs text-gray-400">{p.com} · {p.surf} ha</p>
                  </div>
                  <CARBadge cat={p.cat} />
                  <Badge color={p.statut === 'Melk' ? 'green' : 'blue'}>{p.statut}</Badge>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-[#1b7a45] hover:bg-[#f0faf4] rounded-lg transition-colors" title="Fiche" onClick={() => { setSelectedParcel(p); go('instr'); }}>
                      <FileText size={13} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-[#1b7a45] hover:bg-[#f0faf4] rounded-lg transition-colors" title="Voir sur la carte" onClick={() => { setSelectedParcel(p); go('carte'); }}>
                      <MapPin size={13} />
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Ne plus suivre" onClick={() => delModel('parcels', i)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quick stats */}
        <Card className="p-5">
          <SectionHeader title="Activité du Mois" sub={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} />
          <div className="space-y-3 mt-4">
            {[
              { label: 'Requêtes exécutées', value: store.queries.length * 4 + 2, icon: <BarChart2 size={14} />, color: '#c8a13a' },
              { label: 'Modèles AHP', value: store.amc.length, icon: <Calculator size={14} />, color: '#2196f3' },
              { label: 'Exports générés', value: 3, icon: <Download size={14} />, color: '#9c27b0' },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="p-2 rounded-lg" style={{ background: stat.color + '15', color: stat.color }}>{stat.icon}</span>
                <span className="flex-1 text-sm text-gray-700">{stat.label}</span>
                <span className="text-lg font-bold" style={{ color: stat.color, fontFamily: 'Outfit, sans-serif' }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Saved models */}
      <Card className="p-5">
        <SectionHeader title="Modèles & Requêtes" sub="Modèles AMC et requêtes personnalisées"
          action={<Button variant="outline" size="sm" icon={<Calculator size={12} />} onClick={() => go('amc')}>Nouveau modèle AMC</Button>} />
        
        {store.queries.length === 0 && store.amc.length === 0 ? (
           <div className="text-center py-8 text-gray-500 text-sm">Aucun modèle sauvegardé.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {store.amc.map((m, i) => (
              <div key={`amc-${i}`} className="border border-gray-100 rounded-xl p-4 hover:border-[#1b7a45]/30 hover:bg-[#f0faf4]/50 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#e8f5e9] text-[#2e7d32]">AMC / AHP</span>
                  <Clock size={12} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1 truncate" title={m.name}>{m.name}</p>
                <p className="text-xs text-gray-400 truncate">RC : {m.rc} · {m.date}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" icon={<Play size={12} />} onClick={() => go('amc')}>Ouvrir</Button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer" onClick={() => delModel('amc', i)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            
            {store.queries.map((q, i) => (
              <div key={`query-${i}`} className="border border-gray-100 rounded-xl p-4 hover:border-[#1b7a45]/30 hover:bg-[#f0faf4]/50 transition-all cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Requête</span>
                  <Clock size={12} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1 truncate" title={q.name}>{q.name}</p>
                <p className="text-xs text-gray-400 truncate">{q.hitsCount} résultats · {q.date}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" icon={<Play size={12} />} onClick={() => go('req')}>Ouvrir</Button>
                  <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer" onClick={() => delModel('queries', i)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent exports */}
      <Card className="p-5">
        <SectionHeader title="Exports Récents" sub="Fichiers générés ce mois" />
        <div className="space-y-2 mt-4">
          {[
            { name: 'Planche 1/25 000 — Guelmim NE', format: 'PDF', date: '01/08/2026', time: '11:08' },
            { name: 'Fiche synoptique — TF 12457/56', format: 'PDF', date: '29/07/2026', time: '16:22' },
            { name: 'Export SHP — résultat de requête', format: 'SHP', date: '28/07/2026', time: '10:05' }
          ].map((exp, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                exp.format === 'PDF' ? 'bg-red-500' : 'bg-blue-500'
              }`}>
                {exp.format}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{exp.name}</p>
                <p className="text-xs text-gray-400">{exp.date} · {exp.time}</p>
              </div>
              <button className="p-2 text-[#1b7a45] hover:bg-[#f0faf4] rounded-lg transition-colors" title="Télécharger" onClick={() => toast(`Téléchargement de ${exp.name}...`)}>
                <Download size={14} />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
