import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const { currentView, go, profile, allowed, espCount, RANK, NEED } = useApp();

  const links = [
    { grp: 'PILOTAGE' },
    { v: 'dash', icon: '🏠', label: 'Tableau de bord' },
    { grp: 'EXPLOITATION' },
    { v: 'carte', icon: '🗺️', label: 'Carte & couches' },
    { v: 'loc', icon: '📍', label: 'Localiser une parcelle' },
    { v: 'instr', icon: '🧾', label: 'Instruction parcellaire' },
    { v: 'req', icon: '🔍', label: 'Requêtes & analyses', need: 'decideur' },
    { grp: 'MODÉLISATION' },
    { v: 'amc', icon: '⚖️', label: 'Potentiel agricole (AMC/AHP)', need: 'decideur' },
    { grp: 'MON ESPACE' },
    { v: 'esp', icon: '⭐', label: 'Mon espace', badge: espCount },
    { grp: 'RÉFÉRENTIEL' },
    { v: 'donnees', icon: '🗄️', label: 'Catalogue des données', need: 'editeur' },
    { v: 'rest', icon: '🖨️', label: 'Restitution & exports' },
    { grp: 'SYSTÈME' },
    { v: 'adm', icon: '⚙️', label: 'Administration', need: 'admin' },
  ];

  return (
    <nav>
      {links.map((item, i) => {
        if (item.grp) return <div key={i} className="grp">{item.grp}</div>;
        const ok = allowed(item.v);
        return (
          <a
            key={item.v}
            className={`${currentView === item.v ? 'on' : ''} ${!ok ? 'lock' : ''}`}
            onClick={() => ok && go(item.v)}
          >
            {item.icon} {item.label}
            {item.badge !== undefined && <span className="navcount">{item.badge}</span>}
            {!ok && <span className="lockico">🔒</span>}
          </a>
        );
      })}
      <div className="foot">
        PostgreSQL/PostGIS · GeoServer · OGC WMS/WFS/WMTS<br/>
        Lambert Maroc — ISO 19115<br/>
        Maquette GEOCONSEIL — données fictives
      </div>
    </nav>
  );
}
