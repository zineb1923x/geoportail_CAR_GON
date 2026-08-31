import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Search, Download, Filter, Save, Play, Loader2 } from 'lucide-react';
import { Card, Button, Select, Input, CARBadge, Badge, DataTable, SectionHeader } from '../ui/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../../context/AppContext';

const fieldOptions = [
  { value: 'cat', label: 'Classe CAR' },
  { value: 'com', label: 'Commune' },
  { value: 'surf', label: 'Superficie (ha)' },
  { value: 'score', label: 'Score IPA' },
  { value: 'limitant', label: 'Facteur limitant' },
];

export default function Requetes() {
  const { toast, doExport, store, setStore, simActive, setMapContainer, token } = useApp();

  const [criteria, setCriteria] = useState([
    { field: 'cat', operator: '=', value: 'A' }
  ]);
  const [ran, setRan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hits, setHits] = useState([]);
  const [activeTab, setActiveTab] = useState('table');
  const [qName, setQName] = useState('');
  const [showSaved, setShowSaved] = useState(false);

  const addCriterion = () => {
    setCriteria(c => [...c, { field: 'com', operator: '=', value: '' }]);
  };

  const removeCriterion = (i) => {
    setCriteria(c => c.filter((_, j) => j !== i));
  };

  const runQuery = async (overrideCriteria = null) => {
    const critToUse = overrideCriteria || criteria;
    
    setIsLoading(true);
    setRan(false);
    
    try {
      const t = token || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (t && t !== 'guest') headers['Authorization'] = `Bearer ${t}`;

      const res = await fetch('/api/classement/unitecarteagricole/requetes/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ criteria: critToUse })
      });

      if (!res.ok) throw new Error('Erreur lors de la requête');

      const data = await res.json();
      setHits(data);
      setRan(true);
      setShowSaved(false);
    } catch (err) {
      toast('❌ Erreur de connexion au serveur.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearQuery = () => {
    setCriteria([]);
    setRan(false);
    setHits([]);
  };

  const saveQueryModel = () => {
    const n = qName.trim();
    if (!n) { toast('❌ Donnez un nom à la requête.'); return; }
    if (!ran) { toast("❌ Exécutez d'abord la requête."); return; }
    
    setStore(prev => ({
      ...prev,
      queries: [
        { name: n, criteria: [...criteria], hitsCount: hits.length, date: new Date().toLocaleDateString('fr-FR') },
        ...prev.queries
      ]
    }));
    setQName('');
    toast(`✅ Requête « ${n} » sauvegardée !`);
  };

  const loadQueryModel = (model) => {
    setCriteria(model.criteria);
    runQuery(model.criteria);
    toast(`Requête « ${model.name} » chargée.`);
  };

  // Recharts Data Prep
  const barData = useMemo(() => {
    const byCom = {};
    hits.forEach(p => {
      if (!byCom[p.com]) byCom[p.com] = { name: p.com, A: 0, B: 0, C: 0 };
      if (p.cat) byCom[p.com][p.cat] += 1;
    });
    return Object.values(byCom);
  }, [hits]);

  const pieData = useMemo(() => {
    const byCat = { A: 0, B: 0, C: 0 };
    hits.forEach(p => { if (p.cat) byCat[p.cat] += 1; });
    return [
      { name: 'CAR-A', value: byCat.A, color: '#4caf50' },
      { name: 'CAR-B', value: byCat.B, color: '#ff9800' },
      { name: 'CAR-C', value: byCat.C, color: '#f44336' },
    ].filter(d => d.value > 0);
  }, [hits]);

  const resultRows = hits.map(h => [
    h.id,
    <CARBadge cat={h.cat} />,
    h.surf.toLocaleString('fr-FR'),
    h.com,
    h.statut,
    <Badge color="green">Validé</Badge>
  ]);

  const totalSurf = hits.reduce((acc, h) => acc + h.surf, 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 });

  return (
    <>
      <div className="p-6 overflow-y-auto h-full scroll-area space-y-5" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Requêtes & Analyses</h1>
            <p className="text-sm text-gray-500 mt-0.5">Constructeur de requêtes multi-critères sur les données CAR</p>
          </div>
          <div className="flex gap-2">
            <Button variant={showSaved ? 'primary' : 'ghost'} size="sm" icon={<Filter size={13} />} onClick={() => setShowSaved(!showSaved)}>
              Modèles sauvegardés ({store.queries.length})
            </Button>
            {ran && <Button variant="outline" size="sm" icon={<Download size={13} />} onClick={() => doExport('Export Résultats de Requête')}>Exporter</Button>}
          </div>
        </div>

        {showSaved ? (
          <Card className="p-5">
            <SectionHeader title="Modèles de requêtes sauvegardés" />
            {store.queries.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Aucune requête sauvegardée.</p>
            ) : (
              <div className="space-y-3 mt-4">
                {store.queries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">🔍 {q.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{q.criteria.length} critère(s) · {q.hitsCount} résultat(s) historisé(s) · {q.date}</p>
                    </div>
                    <Button variant="outline" size="sm" icon={<Play size={12} />} onClick={() => loadQueryModel(q)}>Exécuter</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : (
          <>
            {/* Query builder */}
            <Card className="p-5 relative z-10">
              <SectionHeader title="Constructeur de Requête" sub="Ajoutez des critères de filtrage et combinez-les (ET logique par défaut)" />
              <div className="space-y-2.5 mt-4">
                {criteria.map((crit, i) => (
                  <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 bg-gray-50 rounded-xl p-3">
                    {i > 0 && <span className="text-xs font-semibold text-gray-400 w-16 shrink-0 text-center">ET</span>}
                    {i === 0 && <span className="text-xs font-semibold text-gray-400 w-16 shrink-0 text-center">OÙ</span>}
                    
                    <Select
                      value={crit.field}
                      onChange={v => setCriteria(c => c.map((cr, j) => j === i ? { ...cr, field: v } : cr))}
                      options={fieldOptions}
                      className="flex-1 min-w-[140px]"
                    />
                    <Select
                      value={crit.operator}
                      onChange={v => setCriteria(c => c.map((cr, j) => j === i ? { ...cr, operator: v } : cr))}
                      options={[
                        { value: '=', label: 'égal à' }, { value: '!=', label: 'différent de' },
                        { value: '>', label: 'supérieur à' }, { value: '<', label: 'inférieur à' },
                        { value: 'contains', label: 'contient' }
                      ]}
                      className="w-36 shrink-0"
                    />
                    <Input
                      value={crit.value}
                      onChange={v => setCriteria(c => c.map((cr, j) => j === i ? { ...cr, value: v } : cr))}
                      placeholder="Valeur"
                      className="flex-1 min-w-[140px]"
                    />
                    <button onClick={() => removeCriterion(i)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addCriterion}
                  className="flex items-center gap-1.5 text-sm text-[#1b7a45] hover:text-[#166b3c] font-medium mt-2"
                >
                  <Plus size={14} /> Ajouter un critère
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
                <Button 
                  icon={isLoading ? <Loader2 className="animate-spin" size={14} /> : <Search size={14} />} 
                  onClick={() => runQuery()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Recherche en cours...' : 'Exécuter la requête'}
                </Button>
                <Button variant="ghost" onClick={clearQuery} disabled={isLoading}>Réinitialiser</Button>
                
                <div className="flex-1 flex items-center justify-end gap-2 ml-auto">
                   <Input value={qName} onChange={setQName} placeholder="Nom du modèle..." className="w-48" disabled={isLoading} />
                   <Button variant="outline" icon={<Save size={14} />} onClick={saveQueryModel} disabled={!ran || isLoading}>Sauvegarder</Button>
                </div>
              </div>
            </Card>

            {/* Results */}
            {ran && (
              <div className="space-y-4 animate-in fade-in duration-300 relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-[#1b7a45]">{hits.length} résultats</span> trouvés · Superficie totale : <span className="font-semibold">{totalSurf} ha</span>
                  </p>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    {[{ id: 'table', label: 'Tableau' }, { id: 'bar', label: 'Barres' }, { id: 'pie', label: 'Secteurs' }].map(t => (
                      <button key={t.id} onClick={() => setActiveTab(t.id)}
                        className={`px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-[#1b7a45] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {activeTab === 'table' && (
                  <Card>
                    {hits.length > 0 ? (
                      <DataTable
                        columns={['Titre Foncier / ID', 'Classe CAR', 'Superficie (ha)', 'Commune', 'Statut Foncier', 'Statut']}
                        rows={resultRows}
                      />
                    ) : (
                      <div className="p-8 text-center text-gray-500">Aucun résultat ne correspond à vos critères.</div>
                    )}
                    <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{hits.length} résultats affichés</span>
                      <Button size="sm" variant="outline" icon={<Download size={12} />} onClick={() => doExport('Export CSV')}>Export CSV</Button>
                    </div>
                  </Card>
                )}

                {activeTab === 'bar' && hits.length > 0 && (
                  <Card className="p-5">
                    <SectionHeader title="Distribution CAR par Commune" />
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="A" name="CAR-A" fill="#4caf50" radius={[3, 3, 0, 0]} stackId="a" />
                        <Bar dataKey="B" name="CAR-B" fill="#ff9800" radius={[3, 3, 0, 0]} stackId="a" />
                        <Bar dataKey="C" name="CAR-C" fill="#f44336" radius={[3, 3, 0, 0]} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                )}

                {activeTab === 'pie' && hits.length > 0 && (
                  <Card className="p-5 flex flex-col items-center">
                    <SectionHeader title="Répartition Globale des Classes CAR" className="w-full text-left" />
                    <div style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(value) => [`${value} parcelles`, 'Total']} />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Rendu de la carte derrière (MapSlot) pour visibilité globale si besoin */}
      <div className="mapSlot opacity-40 pointer-events-none absolute inset-0 -z-10 mix-blend-multiply" ref={setMapContainer}></div>
    </>
  );
}
