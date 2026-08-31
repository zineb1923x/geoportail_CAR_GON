import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { X, CheckCircle, Clock, Database, Info, FileText } from 'lucide-react';
import { Button, Input, Select, Badge, CARBadge } from '../ui/ui';

export default function CoucheDetailModal({ couche, isServer = false, initialTab = 'info', onClose }) {
  const { toast, token, profile } = useApp();
  const [tab, setTab] = useState(initialTab);

  // Data states
  const [detail, setDetail] = useState(null);
  const [versions, setVersions] = useState(null);
  const [meta, setMeta] = useState(null);
  const [champs, setChamps] = useState(null);

  // Loading states
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [loadingChamps, setLoadingChamps] = useState(false);

  // Edit states
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({});
  const [savingMeta, setSavingMeta] = useState(false);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({});
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingChamps, setEditingChamps] = useState(false);
  const [champsForm, setChampsForm] = useState([]);
  const [savingChamps, setSavingChamps] = useState(false);

  const canEdit = profile === 'editeur' || profile === 'admin';

  const headers = useCallback(() => {
    const h = { 'Content-Type': 'application/json' };
    const t = token || localStorage.getItem('token');
    if (t && t !== 'guest') h['Authorization'] = `Bearer ${t}`;
    return h;
  }, [token]);

  const coucheId = isServer ? couche.id || couche.rawId : null;
  const coucheName = isServer
    ? (couche.nom_affichage || couche.nom_technique || couche.name)
    : (couche.nom || couche[0] || couche.name || 'Couche');
  
  const rawData = isServer && couche.raw ? couche.raw : couche;

  useEffect(() => {
    if (!isServer || !coucheId) return;
    fetch(`/api/referentiel/couches/${coucheId}/`, { headers: headers() })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDetail(data); })
      .catch(() => {});
  }, [coucheId, isServer, headers]);

  useEffect(() => {
    if (tab !== 'history' || !isServer || !coucheId || versions !== null) return;
    setLoadingVersions(true);
    fetch(`/api/referentiel/couches/${coucheId}/versions/`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setVersions(Array.isArray(data) ? data : []))
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false));
  }, [tab, coucheId, isServer, versions, headers]);

  useEffect(() => {
    if (tab !== 'meta' || !isServer || !coucheId || meta !== null) return;
    setLoadingMeta(true);
    fetch(`/api/referentiel/couches/${coucheId}/metadonnees/`, { headers: headers() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setMeta(data);
          setMetaForm(data);
        }
      })
      .catch(() => setMeta({}))
      .finally(() => setLoadingMeta(false));
  }, [tab, coucheId, isServer, meta, headers]);

  useEffect(() => {
    if (tab !== 'champs' || !isServer || !coucheId || champs !== null) return;
    setLoadingChamps(true);
    fetch(`/api/referentiel/couches/${coucheId}/champs/`, { headers: headers() })
      .then(r => r.ok ? r.json() : [])
      .then(data => setChamps(Array.isArray(data) ? data : []))
      .catch(() => setChamps([]))
      .finally(() => setLoadingChamps(false));
  }, [tab, coucheId, isServer, champs, headers]);

  const saveMeta = async () => {
    if (!coucheId) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/metadonnees/`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(metaForm),
      });
      if (res.ok) {
        const data = await res.json();
        setMeta(data);
        setMetaForm(data);
        setEditingMeta(false);
        toast('✅ Métadonnées ISO 19115 mises à jour avec succès.');
      } else {
        toast('❌ Échec de la sauvegarde des métadonnées.');
      }
    } catch {
      toast('❌ Erreur réseau lors de la sauvegarde.');
    } finally {
      setSavingMeta(false);
    }
  };

  const saveInfo = async () => {
    if (!coucheId) return;
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(infoForm),
      });
      if (res.ok) {
        const data = await res.json();
        setDetail(data);
        setEditingInfo(false);
        toast('✅ Informations de la couche mises à jour.');
      } else {
        toast('❌ Échec de la mise à jour.');
      }
    } catch {
      toast('❌ Erreur réseau.');
    } finally {
      setSavingInfo(false);
    }
  };

  const saveChamps = async () => {
    if (!coucheId) return;
    setSavingChamps(true);
    try {
      const res = await fetch(`/api/referentiel/couches/${coucheId}/champs/`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(champsForm),
      });
      if (res.ok) {
        setChamps(champsForm);
        setEditingChamps(false);
        toast('✅ Les descriptions des champs ont été mises à jour.');
      } else {
        toast('❌ Échec de la mise à jour des champs.');
      }
    } catch {
      toast('❌ Erreur lors de la mise à jour des champs.');
    } finally {
      setSavingChamps(false);
    }
  };

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const info = isServer ? (detail || rawData) : null;

  const TABS = [
    { key: 'info', label: 'Informations', icon: <Info size={14} />, always: true },
    { key: 'history', label: 'Historique', icon: <Clock size={14} />, always: true },
    { key: 'meta', label: 'Métadonnées ISO', icon: <FileText size={14} />, always: true },
    { key: 'champs', label: 'Champs PostGIS', icon: <Database size={14} />, always: isServer },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-opacity" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-[850px] h-[90vh] max-h-[700px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header matching DataCatalog side panel */}
        <div className="bg-[#0b3d23] px-6 py-5 flex items-start justify-between shrink-0">
          <div>
            <p className="text-green-300 text-xs mb-1 font-medium tracking-wide uppercase">Inspection de la couche</p>
            <h2 className="text-white font-bold text-xl leading-snug" style={{ fontFamily: 'Outfit, sans-serif' }}>{coucheName}</h2>
            {isServer && info && (
              <p className="text-green-200 text-sm mt-1 opacity-90">
                Thématique : {info.thematique} · Type : {info.type_geometrie} · SRID {info.srid}
              </p>
            )}
            {!isServer && (
              <p className="text-green-200 text-sm mt-1 opacity-90">
                Thématique : {rawData[1] || rawData.thematique || '—'} · Source : {rawData[3] || rawData.source || '—'}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-green-300 hover:text-white mt-0.5 p-1 rounded hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 px-2 pt-2 shrink-0 overflow-x-auto hide-scrollbar">
          {TABS.filter(t => t.always).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === t.key 
                  ? 'border-[#1b7a45] text-[#1b7a45] bg-white' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scroll-area p-6 bg-white">
          
          {/* TAB: Informations */}
          {tab === 'info' && (
            <div className="space-y-6">
              {isServer && info ? (
                <>
                  {!editingInfo ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <InfoRow label="Nom technique" value={info.nom_technique} />
                      <InfoRow label="Nom d'affichage" value={info.nom_affichage} />
                      <InfoRow label="Description" value={info.description || '—'} full />
                      <InfoRow label="Thématique" value={info.thematique} />
                      <InfoRow label="Type de géométrie" value={info.type_geometrie} />
                      <InfoRow label="SRID" value={info.srid} />
                      <InfoRow label="Source" value={info.source || '—'} />
                      <InfoRow label="Millésime" value={info.millesime || '—'} />
                      <InfoRow label="Échelle de référence" value={info.echelle_reference || '—'} />
                      <InfoRow label="Statut" value={<Badge color={info.statut === 'validee' ? 'green' : 'gray'}>{info.statut}</Badge>} />
                      <InfoRow label="Date de création" value={info.date_creation ? new Date(info.date_creation).toLocaleDateString() : '—'} />
                      <InfoRow label="Dernière modification" value={info.date_modification ? new Date(info.date_modification).toLocaleDateString() : '—'} />
                      <InfoRow label="Modifié par" value={info.auteur_nom || '—'} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Nom d'affichage" value={infoForm.nom_affichage} onChange={v => setInfoForm(p => ({ ...p, nom_affichage: v }))} />
                      <Input label="Source" value={infoForm.source} onChange={v => setInfoForm(p => ({ ...p, source: v }))} />
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700">Description</label>
                        <textarea className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#1b7a45]/20 focus:border-[#1b7a45] resize-none" rows={3} value={infoForm.description || ''} onChange={e => setInfoForm(p => ({ ...p, description: e.target.value }))} />
                      </div>
                      <Input label="Millésime" type="number" value={infoForm.millesime} onChange={v => setInfoForm(p => ({ ...p, millesime: v }))} />
                      <Input label="Échelle de référence" value={infoForm.echelle_reference} onChange={v => setInfoForm(p => ({ ...p, echelle_reference: v }))} />
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                    {editingInfo ? (
                      <>
                        <Button variant="ghost" onClick={() => setEditingInfo(false)}>Annuler</Button>
                        <Button variant="primary" onClick={saveInfo} disabled={savingInfo}>{savingInfo ? 'Enregistrement...' : 'Enregistrer'}</Button>
                      </>
                    ) : canEdit && (
                      <Button variant="outline" onClick={() => {
                        setInfoForm({
                          nom_affichage: info.nom_affichage, description: info.description,
                          source: info.source, millesime: info.millesime, echelle_reference: info.echelle_reference
                        });
                        setEditingInfo(true);
                      }}>Modifier les informations</Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <InfoRow label="Couche" value={rawData[0] || rawData.nom || '—'} />
                  <InfoRow label="Thématique" value={rawData[1] || rawData.thematique || '—'} />
                  <InfoRow label="Type" value={rawData[2] === 'base' ? 'Base' : 'Dérivée'} />
                  <InfoRow label="Source / Généalogie" value={rawData[3] || rawData.source || '—'} />
                  <InfoRow label="Statut" value={<Badge color={rawData[4] === 'validee' ? 'green' : 'gray'}>{rawData[4] || rawData.statut || '—'}</Badge>} />
                  <InfoRow label="Dernière MAJ" value={rawData[5] || rawData.date || '—'} />
                  <div className="col-span-2 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                    ℹ️ Cette couche fait partie du référentiel fictif de démonstration. Les détails complets seront disponibles pour les couches importées.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: History */}
          {tab === 'history' && (
            <div className="space-y-6">
              {!isServer ? (
                <MockVersionsTimeline name={coucheName} />
              ) : loadingVersions ? (
                <p className="text-center text-gray-500 py-10">Chargement de l'historique...</p>
              ) : versions && versions.length > 0 ? (
                <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-gray-200">
                  {versions.map((v, i) => (
                    <div key={v.id} className="relative pl-8">
                      <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-[#1b7a45] shadow-[0_0_0_3px_rgba(27,122,69,0.2)]' : 'bg-gray-300'}`} />
                      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge color={i === 0 ? 'green' : 'gray'}>v{v.numero_version}</Badge>
                          <span className="text-xs text-gray-500">{new Date(v.date_version).toLocaleString('fr-FR')}</span>
                          <span className="text-xs text-gray-400">par {v.auteur_nom}</span>
                        </div>
                        {v.description && <p className="text-sm text-gray-700 mb-2">{v.description}</p>}
                        {(v.statut_avant || v.statut_apres) && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge color="gray">{v.statut_avant}</Badge> <span className="text-gray-400">→</span> <Badge color="green">{v.statut_apres}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-10">Aucune version enregistrée.</p>
              )}
            </div>
          )}

          {/* TAB: Meta */}
          {tab === 'meta' && (
            <div className="space-y-6">
              {!isServer ? (
                <MockMetaView name={coucheName} source={rawData[3]} />
              ) : loadingMeta ? (
                <p className="text-center text-gray-500 py-10">Chargement des métadonnées...</p>
              ) : meta ? (
                <>
                  {!editingMeta ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                      <InfoRow label="Titre" value={meta.titre} />
                      <InfoRow label="Résumé" value={meta.resume} full />
                      <InfoRow label="Mots-clés" value={meta.mots_cles} />
                      <InfoRow label="Contact responsable" value={meta.contact_responsable} />
                      <InfoRow label="Organisme producteur" value={meta.organisme} />
                      <InfoRow label="Système de référence" value={meta.systeme_reference} />
                      <InfoRow label="Licence" value={meta.licence} />
                      <InfoRow label="Contraintes d'accès" value={meta.contraintes_acces} />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Titre" value={metaForm.titre} onChange={v => setMetaForm(p => ({ ...p, titre: v }))} />
                      <Input label="Organisme" value={metaForm.organisme} onChange={v => setMetaForm(p => ({ ...p, organisme: v }))} />
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-700">Résumé</label>
                        <textarea className="w-full mt-1 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#1b7a45]/20 focus:border-[#1b7a45] resize-none" rows={3} value={metaForm.resume || ''} onChange={e => setMetaForm(p => ({ ...p, resume: e.target.value }))} />
                      </div>
                      <Input label="Mots-clés" value={metaForm.mots_cles} onChange={v => setMetaForm(p => ({ ...p, mots_cles: v }))} />
                      <Input label="Contact responsable" value={metaForm.contact_responsable} onChange={v => setMetaForm(p => ({ ...p, contact_responsable: v }))} />
                    </div>
                  )}
                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                    {editingMeta ? (
                      <>
                        <Button variant="ghost" onClick={() => { setEditingMeta(false); setMetaForm(meta); }}>Annuler</Button>
                        <Button variant="primary" onClick={saveMeta} disabled={savingMeta}>{savingMeta ? 'Enregistrement...' : 'Enregistrer les métadonnées'}</Button>
                      </>
                    ) : canEdit && (
                      <Button variant="outline" onClick={() => setEditingMeta(true)}>Modifier les métadonnées</Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-10">Aucune métadonnée disponible.</p>
              )}
            </div>
          )}

          {/* TAB: Champs */}
          {tab === 'champs' && (
            <div className="space-y-6">
              {!isServer ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                  ℹ️ L'inspection des champs n'est disponible que pour les couches importées dans PostGIS.
                </div>
              ) : loadingChamps ? (
                <p className="text-center text-gray-500 py-10">Chargement des champs...</p>
              ) : champs && champs.length > 0 ? (
                <>
                  <div className="overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                          <th className="py-3 px-4">Colonne</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Nullable</th>
                          <th className="py-3 px-4 w-1/2">Description (Alias)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(editingChamps ? champsForm : champs).map((c, i) => (
                          <tr key={i} className={`hover:bg-gray-50 ${c.est_geometrie ? 'bg-blue-50/30' : ''}`}>
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">{c.nom}</span>
                              {c.est_geometrie && <Badge color="blue" className="ml-2">géométrie</Badge>}
                            </td>
                            <td className="py-3 px-4 font-mono text-xs text-gray-500">{c.type}</td>
                            <td className="py-3 px-4">{c.nullable ? '✅' : '—'}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {editingChamps && !c.est_geometrie ? (
                                <input
                                  type="text"
                                  className="w-full border border-gray-200 rounded p-1.5 text-xs outline-none focus:border-[#1b7a45]"
                                  value={c.description || ''}
                                  onChange={e => {
                                    const newForm = [...champsForm];
                                    newForm[i].description = e.target.value;
                                    setChampsForm(newForm);
                                  }}
                                  placeholder="Alias ou description..."
                                />
                              ) : (
                                c.description || <span className="text-gray-400 italic">Non renseigné</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 mt-4">
                    {editingChamps ? (
                      <>
                        <Button variant="ghost" onClick={() => { setEditingChamps(false); setChampsForm(JSON.parse(JSON.stringify(champs))); }}>Annuler</Button>
                        <Button variant="primary" onClick={saveChamps} disabled={savingChamps}>{savingChamps ? 'Enregistrement...' : 'Enregistrer les champs'}</Button>
                      </>
                    ) : canEdit && (
                      <Button variant="outline" onClick={() => { setChampsForm(JSON.parse(JSON.stringify(champs))); setEditingChamps(true); }}>Modifier les descriptions</Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-gray-500 py-10">Aucun champ détecté.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value, full = false }) {
  return (
    <div className={`flex flex-col gap-1 py-1 ${full ? 'col-span-2' : ''}`}>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-900">{value || <span className="text-gray-400 italic">Non renseigné</span>}</span>
    </div>
  );
}

function MockVersionsTimeline({ name }) {
  const mockVersions = [
    { v: 3, date: '18/08/2026', author: 'k.benali', desc: `Mise à jour des données de « ${name} » — corrections géométriques.`, from: 'brouillon', to: 'validee' },
    { v: 2, date: '13/07/2026', author: 'f.amrani', desc: 'Ajout de 12 nouvelles entités issues du relevé terrain.', from: 'brouillon', to: 'validee' },
    { v: 1, date: '01/06/2026', author: 'admin', desc: 'Import initial depuis le référentiel.', from: 'brouillon', to: 'validee' },
  ];
  return (
    <div className="relative pl-4 space-y-6 before:absolute before:inset-y-0 before:left-6 before:w-px before:bg-gray-200">
      {mockVersions.map((v, i) => (
        <div key={i} className="relative pl-8">
          <div className={`absolute left-[-5px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? 'bg-[#1b7a45] shadow-[0_0_0_3px_rgba(27,122,69,0.2)]' : 'bg-gray-300'}`} />
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <Badge color={i === 0 ? 'green' : 'gray'}>v{v.v}</Badge>
              <span className="text-xs text-gray-500">{v.date}</span>
              <span className="text-xs text-gray-400">par {v.author}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{v.desc}</p>
            <div className="flex items-center gap-2 text-xs">
              <Badge color="gray">{v.from}</Badge> <span className="text-gray-400">→</span> <Badge color="green">{v.to}</Badge>
            </div>
          </div>
        </div>
      ))}
      <div className="pl-8 pt-4">
        <p className="text-xs text-gray-500 italic">ℹ️ Données fictives de démonstration.</p>
      </div>
    </div>
  );
}

function MockMetaView({ name, source }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4">
      <InfoRow label="Titre" value={name} />
      <InfoRow label="Résumé" value={`Couche de référence du géoportail agricole — ${name}.`} full />
      <InfoRow label="Organisme producteur" value="DRA Guelmim-Oued Noun" />
      <InfoRow label="Contact responsable" value="Cellule CAR" />
      <InfoRow label="Source / Généalogie" value={source || '—'} />
      <InfoRow label="Système de référence" value="EPSG:26192 (Lambert Maroc)" />
      <InfoRow label="Emprise" value="O: -10.5° · E: -8.5° · N: 30.0° · S: 28.0°" />
      <InfoRow label="Licence" value="Usage interne MAPMDREF" />
      <div className="col-span-2 mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        ℹ️ Métadonnées fictives de démonstration. Les fiches ISO 19115 complètes sont disponibles pour les couches importées.
      </div>
    </div>
  );
}
