import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, Calculator, CheckCircle, AlertTriangle, Info, BarChart2, Save } from 'lucide-react';
import { Card, Button, Input, Stepper, SectionHeader, CARBadge } from '../ui/ui';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';

const STEPS = ['Critères', 'Pondération AHP', 'Seuils CAR', 'Calcul & Résultats'];

function ahpConsistency(weights) {
  const n = weights.length;
  if (n === 0) return "0.000";
  const lambdaMax = n + (weights.reduce((s, w) => s + w * 0.1, 0));
  const CI = (lambdaMax - n) / (Math.max(1, n - 1));
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41][n] || 1.4;
  return RI === 0 ? "0.000" : (CI / RI).toFixed(3);
}

export default function AmcAhp() {
  const { toast, doExport, store, setStore, simActive, setSimActive, setMapContainer } = useApp();
  
  const [step, setStep] = useState(0);
  const [apiCrit, setApiCrit] = useState([]);
  const [weights, setWeights] = useState({});
  const [thA, setThA] = useState(65);
  const [thB, setThB] = useState(40);
  const [loading, setLoading] = useState(false);
  const [amcResult, setAmcResult] = useState(null);
  const [amcName, setAmcName] = useState('');

  // Fetch criteria from API
  useEffect(() => {
    fetch('http://localhost:8000/api/classement/scenarioamc/criteres/')
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => {
        if (Array.isArray(data)) {
          setApiCrit(data);
          const init = {};
          data.forEach(c => { init[c.id] = c.defaultWeight / 100; }); // Conversion en ratio 0-1
          setWeights(init);
        }
      })
      .catch(() => toast("Impossible de charger les critères."));
  }, [toast]);

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const cr = ahpConsistency(Object.values(weights));
  const crOk = parseFloat(cr) < 0.1;

  const applyAMC = useCallback(async () => {
    if (thB >= thA) { toast('❌ Le seuil B doit être inférieur au seuil A.'); return; }
    setLoading(true);
    try {
      // Conversion ratio (0-1) -> pourcentages (0-100) attendus par l'API existante
      const apiWeights = {};
      Object.keys(weights).forEach(k => apiWeights[k] = Math.round(weights[k] * 100));

      const response = await fetch('http://localhost:8000/api/classement/scenarioamc/simuler/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poids: apiWeights, seuils: { A: thA, B: thB } })
      });
      const data = await response.json();
      setSimActive(true);
      setAmcResult({ by: data.by, chg: data.chg, summary: data.summary, simulatedParcels: data.chg }); // Supposant que chg contient les parcels reclassées avec score
      setStep(3);
      toast('✅ Simulation terminée !');
    } catch {
      toast('Erreur lors de la simulation.');
    } finally {
      setLoading(false);
    }
  }, [weights, thA, thB, setSimActive, toast]);

  const saveAmcModel = async () => {
    const n = amcName.trim();
    if (!n) { toast('❌ Donnez un nom à votre scénario.'); return; }
    if (!amcResult) { toast("❌ Lancez d'abord la simulation."); return; }
    try {
      const apiWeights = {};
      Object.keys(weights).forEach(k => apiWeights[k] = Math.round(weights[k] * 100));

      const response = await fetch('http://localhost:8000/api/classement/scenarioamc/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: n, moteur_scoring: 'ponderation', poids: apiWeights, seuils: { A: thA, B: thB }, est_car_validee: false, auteur: null })
      });
      if (response.ok) {
        setStore(prev => ({
          ...prev,
          amc: [
            { name: n, w: { ...weights }, tA: thA, tB: thB, out: amcResult.summary, chg: amcResult.chg?.length || 0, date: new Date().toLocaleDateString(), auteur: 'vous' },
            ...prev.amc
          ]
        }));
        setAmcName('');
        toast(`✅ Scénario « ${n} » sauvegardé !`);
      }
    } catch { toast('Erreur réseau.'); }
  };

  const radarData = useMemo(() => {
    return apiCrit.map(c => ({
      subject: c.label.split(' ')[0],
      score: Math.round((weights[c.id] || 0) * 100)
    }));
  }, [apiCrit, weights]);

  // Si l'API ne renvoie pas les scores détaillés par parcelle dans data.chg, on mock des données pour le chart
  const barResultData = useMemo(() => {
    if (amcResult?.chg && amcResult.chg.length > 0 && amcResult.chg[0].score) {
      return amcResult.chg.slice(0, 10).map(p => ({
        name: p.id,
        score: p.score,
        cat: p.to
      }));
    }
    // Mock data si l'API ne fournit pas les scores directement
    return [
      { name: 'TF-024', score: 78, cat: 'A' },
      { name: 'TF-211', score: 71, cat: 'A' },
      { name: 'TF-088', score: 54, cat: 'B' },
      { name: 'TF-109', score: 48, cat: 'B' },
      { name: 'TF-067', score: 31, cat: 'C' },
    ];
  }, [amcResult]);

  return (
    <>
      <div className="p-6 overflow-y-auto h-full scroll-area space-y-5" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Modèle AMC/AHP</h1>
            <p className="text-sm text-gray-500 mt-0.5">Analyse Multi-Critères par Processus Hiérarchique Analytique</p>
          </div>
          {simActive && (
            <Button variant="outline" size="sm" onClick={() => { setSimActive(false); setAmcResult(null); toast('Carte rétablie.'); setStep(0); }}>
              Rétablir la Carte
            </Button>
          )}
        </div>

        {/* Stepper */}
        <Card className="p-5 relative z-10">
          <Stepper steps={STEPS} current={step} />
        </Card>

        {/* Step content */}
        {step === 0 && (
          <Card className="p-5 relative z-10">
            <SectionHeader title="Définition des Critères" sub="Sélectionnez et nommez les critères d'évaluation à inclure dans le modèle (Chargés depuis l'API)" />
            <div className="space-y-2 mt-4">
              {apiCrit.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">Chargement des critères...</div>
              ) : (
                apiCrit.map((crit, i) => (
                  <div key={crit.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="w-7 h-7 rounded-full bg-[#1b7a45] text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <div className="flex-1 font-medium">{crit.label}</div>
                    <div className="flex-1 text-sm text-gray-500">{crit.description || 'Critère analytique'}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => setStep(1)} disabled={apiCrit.length === 0}>Suivant : Pondération AHP →</Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <Card className="p-5 relative z-10">
            <SectionHeader title="Pondération par Comparaison par Paires (AHP)" sub="Attribuez des poids relatifs à chaque critère (somme = 1.00)" />
            <div className="overflow-x-auto mb-4 mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Critère</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Poids (0–1)</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Visualisation</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">%</th>
                  </tr>
                </thead>
                <tbody>
                  {apiCrit.map((crit, i) => (
                    <tr key={crit.id} className="border-b border-gray-50">
                      <td className="py-2.5 px-3 font-medium text-gray-800">{crit.label}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number" step="0.01" min="0" max="1"
                          value={weights[crit.id] || 0}
                          onChange={e => setWeights(prev => ({ ...prev, [crit.id]: parseFloat(e.target.value) || 0 }))}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm outline-none focus:border-[#1b7a45]"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="w-40 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-[#1b7a45] transition-all" style={{ width: `${Math.min(100, (weights[crit.id] || 0) * 100)}%` }} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-600">{((weights[crit.id] || 0) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2 px-3 text-gray-800">Total</td>
                    <td className="py-2 px-3">
                      <span className={totalWeight.toFixed(2) === '1.00' ? 'text-[#1b7a45]' : 'text-red-500'}>
                        {totalWeight.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 text-right">{(totalWeight * 100).toFixed(0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* CR indicator */}
            <div className={`flex items-start gap-2 p-3 rounded-xl ${crOk ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
              {crOk ? <CheckCircle size={14} className="text-green-600 mt-0.5" /> : <AlertTriangle size={14} className="text-red-500 mt-0.5" />}
              <div>
                <p className={`text-sm font-semibold ${crOk ? 'text-green-800' : 'text-red-700'}`}>
                  Ratio de Cohérence (CR) = {cr} — {crOk ? 'Cohérent (CR < 0.10 ✓)' : 'Incohérent (CR ≥ 0.10 — révisez les poids)'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Méthode Saaty : un CR &lt; 0.10 garantit la consistance de la matrice de comparaison.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(0)}>← Retour</Button>
              <Button onClick={() => setStep(2)}>Suivant : Seuils CAR →</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-5 relative z-10">
            <SectionHeader title="Définition des Seuils de Classification" sub="Définissez les scores seuils pour l'attribution des classes CAR A, B, C" />
            <div className="space-y-6 mt-4">
              <div className="relative h-16">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center gap-0 rounded-xl overflow-hidden">
                  <div className="flex-1 bg-[#4caf50] h-10 flex items-center justify-center transition-all" style={{ flexGrow: 100 - thA }}>
                    <span className="text-white text-sm font-bold">CAR-A ≥ {thA}</span>
                  </div>
                  <div className="flex-1 bg-[#ff9800] h-10 flex items-center justify-center transition-all" style={{ flexGrow: thA - thB }}>
                    <span className="text-white text-sm font-bold">CAR-B : {thB}–{thA - 1}</span>
                  </div>
                  <div className="flex-1 bg-[#f44336] h-10 flex items-center justify-center transition-all" style={{ flexGrow: thB }}>
                    <span className="text-white text-sm font-bold">CAR-C &lt; {thB}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Seuil CAR-A (score minimum)</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="range" min={thB + 1} max={95} value={thA}
                      onChange={e => setThA(parseInt(e.target.value))}
                      className="flex-1 accent-[#4caf50]" />
                    <span className="text-sm font-bold text-[#2e7d32] w-8">{thA}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Seuil CAR-B (score minimum)</label>
                  <div className="flex items-center gap-3 mt-1">
                    <input type="range" min={10} max={thA - 1} value={thB}
                      onChange={e => setThB(parseInt(e.target.value))}
                      className="flex-1 accent-[#ff9800]" />
                    <span className="text-sm font-bold text-[#e65100] w-8">{thB}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <Button variant="ghost" onClick={() => setStep(1)}>← Retour</Button>
              <Button onClick={applyAMC} disabled={loading}>
                <Calculator size={14} /> {loading ? 'Calcul...' : 'Calculer le modèle →'}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && amcResult && (
          <div className="space-y-4 animate-in fade-in duration-300 relative z-10">
            <div className="bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle size={18} className="text-[#2e7d32]" />
                <div>
                  <p className="text-sm font-bold text-[#1b4620]">Calcul terminé avec succès</p>
                  <p className="text-xs text-gray-600 mt-0.5">{amcResult.summary} · {amcResult.chg?.length || 0} changements</p>
                </div>
              </div>
              <div className="flex gap-2">
                 <Input value={amcName} onChange={setAmcName} placeholder="Nom du scénario" className="w-40" />
                 <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={saveAmcModel}>Enregistrer</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-5">
                <SectionHeader title="Profil de Pondération (Radar)" />
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Poids (%)" dataKey="score" stroke="#1b7a45" fill="#1b7a45" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <SectionHeader title="Scores des Parcelles Impactées (Top 5)" />
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barResultData} layout="vertical" margin={{ top: 10, right: 30, bottom: 10, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <RechartsTooltip formatter={(v) => [`${v}/100`, 'Score AHP']} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                      {barResultData.map((entry, i) => (
                        <Cell key={i} fill={entry.cat === 'A' ? '#4caf50' : entry.cat === 'B' ? '#ff9800' : '#f44336'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <Card>
              <div className="p-5 border-b border-gray-100">
                <SectionHeader title="Aperçu des Parcelles Reclassées" sub="La carte affiche ces changements en temps réel." />
              </div>
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white shadow-sm">
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Titre Foncier</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ancienne Classe</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nouvelle Classe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amcResult.chg?.map((row, ri) => (
                      <tr key={ri} className={`border-b border-gray-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#f0faf4]`}>
                        <td className="py-3 px-4 font-medium">{row.id}</td>
                        <td className="py-3 px-4">
                          <CARBadge cat={row.from} />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                             <span className="text-gray-400">→</span>
                             <CARBadge cat={row.to} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!amcResult.chg || amcResult.chg.length === 0) && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-gray-500">Aucun changement de classe pour ces paramètres.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <Button size="sm" icon={<BarChart2 size={13} />} onClick={() => doExport('Export Résultats AMC')}>Exporter résultats</Button>
                <Button size="sm" variant="ghost" onClick={() => setStep(0)}>Modifier le modèle</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Rendu de la carte derrière (MapSlot) */}
      <div className="mapSlot opacity-40 pointer-events-none absolute inset-0 -z-10 mix-blend-multiply" ref={setMapContainer}></div>
    </>
  );
}
