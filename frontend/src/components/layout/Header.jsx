import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PARCELS } from '../../data/parcels';
import { COMMUNES } from '../../data/communes';

export default function Header() {
  const { go, toast, profile, user, logout, currentView, VIEWS, allowed, espCount } = useApp();
  const [searchVal, setSearchVal] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const blurTimer = useRef(null);
  const menuTimer = useRef(null);

  const handleLogout = () => {
    logout();
    toast('Déconnexion réussie.');
  };

  const [results, setResults] = useState([]);

  useEffect(() => {
    const q = searchVal.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`http://localhost:8000/api/referentiel/recherche-globale/?q=${encodeURIComponent(q)}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.map(hit => {
            let t = '🔍';
            if (hit.type === 'Commune') t = '🏘️';
            if (hit.type === 'Unité CAR') t = '🗺️';
            if (hit.type === 'Titre Foncier') t = '📄';
            return {
              t,
              l: hit.label,
              s: hit.sous_label,
              id: hit.id,
              type: hit.type
            };
          }));
        })
        .catch(err => {
          console.error("Search error:", err);
          setResults([]);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchVal]);

  const handleSearchClick = (hit) => {
    setSearchVal('');
    setShowResults(false);
    if (hit.type === 'Unité CAR' || hit.type === 'Titre Foncier') {
      go('carte');
      // On pourrait déclencher le selectParcel ici via le context ou un event global si connecté
    } else if (hit.type === 'Commune') {
      go('carte');
      toast('Commune de ' + hit.label + ' — zoom appliqué.');
    }
  };

  // Navigation structure with dropdown groups
  const navGroups = [
    {
      label: '🏠 Tableau de bord',
      v: 'dash',
      single: true
    },
    {
      label: '📊 Exploitation',
      items: [
        { v: 'carte', icon: '🗺️', label: 'Carte & couches' },
        { v: 'loc', icon: '📍', label: 'Localiser une parcelle' },
        { v: 'instr', icon: '🧾', label: 'Instruction parcellaire' },
        { v: 'req', icon: '🔍', label: 'Requêtes & analyses' },
      ]
    },
    {
      label: '⚖️ Modélisation',
      items: [
        { v: 'amc', icon: '⚖️', label: 'Potentiel agricole (AMC/AHP)' },
      ]
    },
    {
      label: '⭐ Mon espace',
      v: 'esp',
      single: true,
      badge: espCount
    },
    {
      label: '🗄️ Référentiel',
      items: [
        { v: 'donnees', icon: '🗄️', label: 'Catalogue des données' },
        { v: 'rest', icon: '🖨️', label: 'Restitution & exports' },
      ]
    },
    {
      label: '⚙️ Administration',
      v: 'adm',
      single: true
    }
  ];

  const handleMenuEnter = (idx) => {
    clearTimeout(menuTimer.current);
    setOpenMenu(idx);
  };

  const handleMenuLeave = () => {
    menuTimer.current = setTimeout(() => setOpenMenu(null), 150);
  };

  const handleNavClick = (v) => {
    if (allowed(v)) {
      go(v);
      setOpenMenu(null);
    }
  };

  // Check if any item in a group is currently active
  const isGroupActive = (group) => {
    if (group.single) return currentView === group.v;
    return group.items?.some(item => currentView === item.v);
  };

  return (
    <>
      {/* Top header bar */}
      <header>
        <svg className="logo" viewBox="0 0 64 64" role="img" aria-label="Logo Géoportail Agricole">
          <defs><linearGradient id="lgbg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0b3d23"/><stop offset="1" stopColor="#1b7a45"/></linearGradient></defs>
          <rect x="1.5" y="1.5" width="61" height="61" rx="13" fill="url(#lgbg)" stroke="#c8a13a" strokeWidth="2.5"/>
          <polygon points="32,10 51,20 32,30 13,20" fill="#fdd835"/>
          <polygon points="32,21 51,31 32,41 13,31" fill="#8bc34a"/>
          <polygon points="32,32 51,42 32,52 13,42" fill="#eef7ee"/>
          <path d="M32 8 q6.5 6.5 0 14 q-6.5 -7.5 0 -14" fill="#0b3d23" stroke="#c8a13a" strokeWidth="1.4"/>
          <circle cx="32" cy="15" r="2.2" fill="#c8a13a"/>
          <text x="32" y="60.5" textAnchor="middle" fontSize="7.2" fontWeight="800" fill="#f4e8c6" fontFamily="Segoe UI,Arial" letterSpacing=".6">GÉOPORTAIL</text>
        </svg>
        <div>
          <h1>Géoportail Agricole — CAR Guelmim-Oued Noun</h1>
          <div className="sub">MAPMDREF · DRA-GON · Marché N° 23/2025/DRA/GON/DIAEA</div>
        </div>
        <div className="spacer"></div>
        <div className="gsearch">
          <span className="ico">🔎</span>
          <input
            type="text"
            placeholder="TF, unité, commune…"
            value={searchVal}
            onChange={e => { setSearchVal(e.target.value); setShowResults(true); }}
            onBlur={() => { blurTimer.current = setTimeout(() => setShowResults(false), 200); }}
            onFocus={() => { if (searchVal.length >= 2) setShowResults(true); }}
          />
          <div className={`res ${showResults && results.length > 0 ? 'open' : ''}`}>
            {results.length === 0 && searchVal.length >= 2 && (
              <div className="it"><span style={{ color: 'var(--muted)' }}>Aucun résultat</span></div>
            )}
            {results.map((hit, i) => (
              <div key={i} className="it" onClick={() => handleSearchClick(hit)}>
                {hit.t} {hit.l}<small>{hit.s}</small>
              </div>
            ))}
          </div>
        </div>
        <button className="btn-hd" onClick={() => setHelpOpen(true)}>❓ Aide</button>
        <span className="badge-demo">MAQUETTE V5</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
          {(!user || profile === 'consult' || user.username === 'Consultant') ? (
            <>
              <span>👤 Visiteur</span>
              <button className="btn-hd" onClick={() => go('login')}>Connexion</button>
            </>
          ) : (
            <>
              <span>👤 {user.username}</span>
              <button className="btn-hd" onClick={handleLogout}>Déconnexion</button>
            </>
          )}
        </div>
      </header>

      {/* Horizontal navbar */}
      <div className="navbar">
        {navGroups.map((group, idx) => {
          const active = isGroupActive(group);

          if (group.single) {
            const ok = allowed(group.v);
            return (
              <div
                key={idx}
                className={`nav-item ${active ? 'active' : ''} ${!ok ? 'locked' : ''}`}
                onClick={() => ok && handleNavClick(group.v)}
              >
                <span className="nav-label">
                  {group.label}
                  {group.badge !== undefined && group.badge > 0 && (
                    <span className="nav-badge">{group.badge}</span>
                  )}
                  {!ok && <span className="nav-lock">🔒</span>}
                </span>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className={`nav-item has-dropdown ${active ? 'active' : ''} ${openMenu === idx ? 'open' : ''}`}
              onMouseEnter={() => handleMenuEnter(idx)}
              onMouseLeave={handleMenuLeave}
            >
              <span className="nav-label">
                {group.label}
                <span className="nav-arrow">▾</span>
              </span>
              <div className="nav-dropdown">
                {group.items.map(item => {
                  const ok = allowed(item.v);
                  return (
                    <div
                      key={item.v}
                      className={`nav-dd-item ${currentView === item.v ? 'active' : ''} ${!ok ? 'locked' : ''}`}
                      onClick={() => ok && handleNavClick(item.v)}
                    >
                      <span className="nav-dd-icon">{item.icon}</span>
                      <span>{item.label}</span>
                      {!ok && <span className="nav-lock">🔒</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="nav-spacer"></div>
        <div className="nav-info">
          PostgreSQL/PostGIS · GeoServer · OGC WMS/WFS/WMTS · Lambert Maroc — ISO 19115
        </div>
      </div>

      {/* Help Overlay */}
      <div className={`helpov ${helpOpen ? 'open' : ''}`} onClick={e => { if (e.target === e.currentTarget) setHelpOpen(false); }}>
        <div className="helppanel">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h3>Guide rapide du Géoportail</h3>
            <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => setHelpOpen(false)}>✖ Fermer</button>
          </div>
          <h4>📍 Localiser et instruire une parcelle</h4>
          <p>Module « Localiser une parcelle » : choisissez une méthode (coordonnées, listing X;Y, fichier SHP/DXF, titre foncier, commune), saisissez, vérifiez le résultat, puis « Générer la fiche synoptique ». La fiche en 7 rubriques s'ouvre dans « Instruction parcellaire » avec l'avis indicatif et l'édition PDF.</p>
          <h4>🔍 Requêtes et modèles</h4>
          <p>Composez vos critères (catégorie, statut foncier, distance à l'eau, urbanisme), exécutez, puis <b>enregistrez la requête comme modèle nommé</b> : les critères et l'état de sortie sont conservés dans « Mon espace » et rejouables en un clic. Un résultat peut aussi devenir une couche dérivée du catalogue.</p>
          <h4>⚖️ Modèles AMC / AHP</h4>
          <p>Déroulez les 4 étapes (critères → pondération → seuils → calcul). Le classement simulé s'affiche sur la carte avec le bandeau « simulation ». <b>Nommez et enregistrez votre modèle</b> (poids, seuils, ratio de cohérence, résultat) pour le réappliquer ou le comparer depuis « Mon espace ». Seule la CAR validée demeure opposable.</p>
          <h4>🗺️ Couches et sous-couches</h4>
          <p>Dans « Carte &amp; couches », chaque thématique se déplie ; les cases mères (CAR A/B/C, points d'eau, statuts fonciers, projets) activent tout un groupe, les cases filles activent chaque sous-couche individuellement.</p>
          <h4>⭐ Mon espace</h4>
          <p>Retrouvez vos modèles de requêtes, vos modèles AMC, vos parcelles suivies (bouton « Suivre » sur la carte d'identité d'une parcelle) et vos éditions récentes.</p>
        </div>
      </div>
    </>
  );
}
