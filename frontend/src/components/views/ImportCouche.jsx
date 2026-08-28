import { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';

const THEMATIQUES = [
  { value: 'communes', label: 'Communes' },
  { value: 'provinces', label: 'Provinces' },
  { value: 'regions', label: 'Régions' },
  { value: 'car_a', label: 'Potentiel A (fort)' },
  { value: 'car_b', label: 'Potentiel B (moyen)' },
  { value: 'car_c', label: 'Potentiel C (faible)' },
  { value: 'sols', label: 'Unités pédologiques' },
  { value: 'oued', label: 'Oueds et réseau hydrographique' },
  { value: 'eau_forage', label: 'Points d\'eau : Forages' },
  { value: 'eau_puits', label: 'Points d\'eau : Puits' },
  { value: 'eau_source', label: 'Points d\'eau : Sources' },
  { value: 'gh', label: 'Périmètres irrigués : GH' },
  { value: 'pmh', label: 'Périmètres irrigués : PMH' },
  { value: 'ppp', label: 'PPP en irrigation' },
  { value: 'priv', label: 'Irrigation privée' },
  { value: 'nappes', label: 'Nappes' },
  { value: 'pei', label: 'Périmètres PEI' },
  { value: 'proj_p1', label: 'Pilier I du PMV' },
  { value: 'proj_p2', label: 'Pilier II du PMV' },
  { value: 'proj_mca', label: 'Projets MCA' },
  { value: 'proj_pmvb', label: 'PMVB' },
  { value: 'proj_pam', label: 'Sites d\'amélioration pastorale' },
  { value: 'past', label: 'Zones pastorales' },
  { value: 'oasis', label: 'Zones oasiennes' },
  { value: 'urb', label: 'Documents d\'urbanisme' },
  { value: 'ra', label: 'Zones RA' },
  { value: 'ocs', label: 'Occupation du sol (OCS)' },
  { value: 'bati', label: 'Bâti' },
  { value: 'tf', label: 'Titres fonciers' },
  { value: 'stat_melk', label: 'Statuts fonciers : Melk' },
  { value: 'stat_coll', label: 'Statuts fonciers : Collectif' },
  { value: 'stat_hab', label: 'Statuts fonciers : Habous' },
  { value: 'stat_dom', label: 'Statuts fonciers : Domanial' },
];

const FORMATS_ACCEPTES = '.zip,.geojson,.json,.kml,.kmz,.gpkg,.dxf';

export default function ImportCouche({ onClose, onSuccess }) {
  const { token, toast } = useApp();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [nom, setNom] = useState('');
  const [thematique, setThematique] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // Étape 1: fichier, 2: métadonnées, 3: résultat
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      // Pré-remplir le nom à partir du fichier
      if (!nom) {
        const baseName = f.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ_\s-]/g, '');
        setNom(baseName);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !nom || !thematique) {
      toast('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('nom', nom);
      formData.append('thematique', thematique);
      formData.append('description', description);
      formData.append('source', source);

      const res = await fetch('http://localhost:8000/api/referentiel/import/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep(3);
        toast(`✅ Import réussi : ${data.feature_count} entités importées !`);
        if (onSuccess) onSuccess(data);
      } else {
        const errorMsg = data.details ? data.details.join(', ') : data.error;
        toast(`❌ Erreur : ${errorMsg}`);
      }
    } catch (err) {
      toast(`❌ Erreur réseau : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content import-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* En-tête */}
        <div className="modal-header">
          <h2>📥 Importer une couche</h2>
          <button className="btn sm ghost" onClick={onClose}>✕</button>
        </div>

        {/* Indicateur d'étapes */}
        <div className="import-steps">
          <div className={`import-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-num">1</span>
            <span className="step-label">Fichier</span>
          </div>
          <div className="step-line" />
          <div className={`import-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-num">2</span>
            <span className="step-label">Métadonnées</span>
          </div>
          <div className="step-line" />
          <div className={`import-step ${step >= 3 ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span className="step-label">Résultat</span>
          </div>
        </div>

        {/* Étape 1 : Sélection du fichier */}
        {step === 1 && (
          <div className="modal-body">
            <div 
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragover'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('dragover'); }}
              onDrop={(e) => { 
                e.preventDefault(); 
                e.currentTarget.classList.remove('dragover');
                if (e.dataTransfer.files[0]) {
                  setFile(e.dataTransfer.files[0]);
                  if (!nom) setNom(e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, ''));
                }
              }}
            >
              {file ? (
                <>
                  <span className="drop-icon">📄</span>
                  <span className="drop-filename">{file.name}</span>
                  <span className="drop-size">{(file.size / 1024 / 1024).toFixed(2)} Mo</span>
                  <span className="drop-hint">Cliquez pour changer de fichier</span>
                </>
              ) : (
                <>
                  <span className="drop-icon">📂</span>
                  <span className="drop-main">Glissez-déposez votre fichier ici</span>
                  <span className="drop-hint">ou cliquez pour parcourir</span>
                  <span className="drop-formats">
                    Formats acceptés : Shapefile (.zip), GeoJSON, KML, GeoPackage, DXF
                  </span>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={FORMATS_ACCEPTES}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <div className="modal-actions">
              <button className="btn sm ghost" onClick={onClose}>Annuler</button>
              <button 
                className="btn sm" 
                disabled={!file}
                onClick={() => setStep(2)}
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* Étape 2 : Métadonnées */}
        {step === 2 && (
          <form className="modal-body" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nom de la couche <span className="req">*</span></label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex : carte_agricole_2026"
                  required
                />
                <small>Format recommandé : thématique_objet_millésime (minuscules, sans accents)</small>
              </div>

              <div className="form-group">
                <label>Thématique <span className="req">*</span></label>
                <select
                  value={thematique}
                  onChange={(e) => setThematique(e.target.value)}
                  required
                >
                  <option value="">— Sélectionnez une thématique —</option>
                  {THEMATIQUES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group full">
                <label>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description de la couche, contexte, usage..."
                  rows={3}
                />
              </div>

              <div className="form-group full">
                <label>Source / Organisme producteur</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Ex : DRA Guelmim-Oued Noun / ORMVA"
                />
              </div>
            </div>

            <div className="import-info">
              <span className="info-icon">ℹ️</span>
              <span>
                La couche sera créée avec le statut <strong>« Brouillon »</strong> et devra être validée 
                par l'Administrateur avant d'être publiée. La reprojection vers Lambert Maroc (SRID 26192) 
                sera effectuée automatiquement.
              </span>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn sm ghost" onClick={() => setStep(1)}>← Retour</button>
              <button type="submit" className="btn sm" disabled={loading || !nom || !thematique}>
                {loading ? '⏳ Import en cours...' : '📥 Lancer l\'import'}
              </button>
            </div>
          </form>
        )}

        {/* Étape 3 : Résultat */}
        {step === 3 && result && (
          <div className="modal-body">
            <div className="import-result success">
              <span className="result-icon">✅</span>
              <h3>Import terminé avec succès !</h3>
              <div className="result-details">
                <div className="result-row">
                  <span>Entités importées</span>
                  <strong>{result.feature_count}</strong>
                </div>
                <div className="result-row">
                  <span>Table créée</span>
                  <strong>{result.table_name}</strong>
                </div>
                <div className="result-row">
                  <span>Statut</span>
                  <span className="pill warn">Brouillon — en attente de validation</span>
                </div>
              </div>
              {result.warnings && result.warnings.length > 0 && (
                <div className="result-warnings">
                  <strong>⚠️ Avertissements :</strong>
                  <ul>
                    {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn sm" onClick={onClose}>Fermer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
