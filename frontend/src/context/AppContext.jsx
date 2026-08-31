import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const AppContext = createContext();

const VIEWS = {
  dash: 'Tableau de bord', carte: 'Carte & couches', loc: 'Localiser une parcelle',
  instr: 'Instruction parcellaire', req: 'Requêtes & analyses', amc: 'Potentiel agricole (AMC/AHP)',
  esp: 'Mon espace', donnees: 'Catalogue des données', rest: 'Restitution & exports', adm: 'Administration'
};

const RANK = { consult: 0, decideur: 1, editeur: 2, admin: 3 };
const NEED = { req: 'decideur', amc: 'decideur', esp: 'decideur', donnees: 'editeur', adm: 'admin' };

export function AppProvider({ children }) {
  const [currentView, setCurrentView] = useState('dash');
  const navigateRef = useRef(null);
  const setNavigate = useCallback((fn) => { navigateRef.current = fn; }, []);
  
  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [simActive, setSimActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef(null);
  const [amcResult, setAmcResult] = useState(null);
  const [store, setStore] = useState({
    queries: [
      { name: "Terres B collectives à moins de 500 m d'un point d'eau", crit: { cat: 'B', stat: 'Collectif', eau: '500', urb: '' }, out: '1 entité · 128,4 ha', date: '28/07/2026', auteur: 'f.amrani' },
      { name: "Catégorie A hors périmètre urbain", crit: { cat: 'A', stat: '', eau: '', urb: 'hors' }, out: '2 entités · 79,8 ha', date: '21/07/2026', auteur: 'k.benali' }
    ],
    amc: [
      { name: "Référence CAR (pondération validée)", w: { sol: 35, eau: 25, clim: 15, occ: 15, cont: 10 }, tA: 70, tB: 45, rc: '0,04', out: 'Classement identique à la CAR validée', chg: 0, date: '15/06/2026', auteur: 'cellule CAR' },
      { name: "Scénario eau renforcée", w: { sol: 25, eau: 40, clim: 10, occ: 15, cont: 10 }, tA: 70, tB: 45, rc: '0,07', out: 'Non recalculé depuis la dernière MAJ des couches', chg: '—', date: '02/08/2026', auteur: 'f.amrani' }
    ],
    parcels: []
  });

  const [serverCouches, setServerCouches] = useState([]);
  
  // Shared ref for Map Portal target
  const [mapContainer, setMapContainer] = useState(null);
  
  // Localisation
  const [localizedFeature, setLocalizedFeature] = useState(null);

  const loadServerCouches = useCallback(() => {
    const t = token || localStorage.getItem('token');
    const headers = {};
    if (t && t !== 'guest') headers['Authorization'] = `Bearer ${t}`;

    fetch('/api/referentiel/couches/', { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setServerCouches(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    loadServerCouches();
  }, [loadServerCouches]);

  const [layerVis, setLayerVis] = useState({
    communes: true, provinces: false, regions: false,
    car: true, oued: true, eau: true, urb: true, ra: true, bati: true, tf: true, proj: true,
    gh: true, pmh: true, oasis: true, nappes: false, pei: false, ppp: false, priv: false,
    ndvi: false, ocs: false, sols: false, stat: false, past: false, over: true,
    // Basemaps (mutually exclusive — M1-03)
    esri: true, osm: false, topo: false, neutre: false
  });
  const [subVis, setSubVis] = useState({
    eau: { forage: true, puits: true, source: true },
    proj: { p1: true, p2: true, mca: true, pmvb: true, pam: true },
    stat: { melk: false, coll: false, hab: false, dom: false }
  });
  const [catVis, setCatVis] = useState({ A: true, B: true, C: true });
  const [carOpacity, setCarOpacity] = useState(0.95);

  const allowed = useCallback((v) => !NEED[v] || RANK[profile] >= RANK[NEED[v]], [profile]);

  const go = useCallback((v) => {
    if (!(!NEED[v] || RANK[profile] >= RANK[NEED[v]])) {
      toast('Module « ' + VIEWS[v] + ' » non accessible avec le profil ' + profile + ' — voir la matrice des droits.');
      return;
    }
    setCurrentView(v);
  }, [profile]);

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 4200);
  }, []);

  const doExport = useCallback((w) => {
    toast('🖨 ' + w + ' : génération simulée — mise en page normalisée (titre, légende, échelle, sources, projection Lambert, logos MAPMDREF/DRA-GON), export journalisé.');
  }, [toast]);

  const followParcel = useCallback((id) => {
    setStore(prev => {
      if (prev.parcels.includes(id)) {
        toast('La parcelle ' + id + ' est déjà suivie (voir Mon espace).');
        return prev;
      }
      toast('Parcelle ' + id + ' ajoutée aux parcelles suivies — retrouvez-la dans ⭐ Mon espace.');
      return { ...prev, parcels: [...prev.parcels, id] };
    });
  }, [toast]);

  const espCount = store.queries.length + store.amc.length + store.parcels.length;

  const login = async (username, password) => {
    try {
      const res = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access);
        localStorage.setItem('token', data.access);
        await fetchProfile(data.access);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const loginAsGuest = () => {
    setToken('guest');
    localStorage.setItem('token', 'guest');
    setUser({ username: 'Consultant' });
    setProfile('consult');
  };

  const fetchProfile = async (accessToken) => {
    if (accessToken === 'guest') {
      setUser({ username: 'Consultant' });
      setProfile('consult');
      return;
    }
    try {
      const res = await fetch('/api/auth/me/', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setProfile(data.role || 'consult');
      } else {
        logout();
      }
    } catch (e) {
      console.error(e);
      logout();
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProfile(null);
    localStorage.removeItem('token');
    setCurrentView('dash');
  };

  useEffect(() => {
    if (token && !profile) {
      fetchProfile(token);
    }
  }, [token]);

  const value = {
    currentView, setCurrentView, go,
    profile, setProfile, user,
    token, login, loginAsGuest, logout,
    setNavigate,
    selectedParcel, setSelectedParcel,
    simActive, setSimActive,
    amcResult, setAmcResult,
    toastMsg, toastVisible, toast,
    doExport,
    store, setStore,
    followParcel,
    allowed, espCount,
    VIEWS, RANK, NEED,
    serverCouches, loadServerCouches,
    localizedFeature, setLocalizedFeature,
    layerVis, setLayerVis,
    subVis, setSubVis,
    catVis, setCatVis,
    carOpacity, setCarOpacity,
    mapContainer, setMapContainer
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
