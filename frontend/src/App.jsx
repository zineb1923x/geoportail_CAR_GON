import { useRef, useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { createPortal } from 'react-dom';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Toast from './components/common/Toast';
import MapPanel from './components/map/MapPanel';
import Dashboard from './components/views/Dashboard';
import CarteView from './components/views/CarteView';
import Localiser from './components/views/Localiser';
import Instruction from './components/views/Instruction';
import Requetes from './components/views/Requetes';
import AmcAhp from './components/views/AmcAhp';
import MonEspace from './components/views/MonEspace';
import Catalogue from './components/views/Catalogue';
import Restitution from './components/views/Restitution';
import Administration from './components/views/Administration';

import LoginView from './components/views/LoginView';

// Map internal view keys to URL paths
const VIEW_PATHS = {
  dash: '/tableau-de-bord',
  carte: '/carte',
  loc: '/localiser',
  instr: '/instruction',
  req: '/requetes',
  amc: '/modelisation',
  esp: '/mon-espace',
  donnees: '/catalogue',
  rest: '/restitution',
  adm: '/administration',
  login: '/connexion'
};

// Reverse map: path -> view key
const PATH_VIEWS = Object.fromEntries(
  Object.entries(VIEW_PATHS).map(([k, v]) => [v, k])
);

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthWrapper />
      </AppProvider>
    </BrowserRouter>
  );
}

function AuthWrapper() {
  const { token, profile, loginAsGuest } = useApp();
  
  useEffect(() => {
    if (!token && !profile) {
      loginAsGuest();
    }
  }, [token, profile, loginAsGuest]);

  if (!token || !profile) {
    return <div style={{ padding: '20px' }}>Chargement...</div>;
  }
  
  return <AppShell />;
}

import Layout from './components/layout/Layout';

function AppShell() {
  const { currentView, setCurrentView } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { setNavigate } = useApp();

  // Provide the navigate function to AppContext
  useEffect(() => {
    setNavigate(() => navigate);
  }, [navigate, setNavigate]);

  // Sync URL → currentView on page load or URL change
  useEffect(() => {
    const viewKey = PATH_VIEWS[location.pathname];
    if (viewKey && viewKey !== currentView) {
      setCurrentView(viewKey);
    } else if (location.pathname === '/') {
      setCurrentView('dash');
      navigate(VIEW_PATHS['dash'], { replace: true });
    }
  }, [location.pathname]);

  const isInitialMount = useRef(true);

  // Sync currentView → URL when view changes internally
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const expectedPath = VIEW_PATHS[currentView];
    if (expectedPath && location.pathname !== expectedPath) {
      navigate(expectedPath);
    }
  }, [currentView]); // Dépendance uniquement sur currentView !

  const hasMap = ['carte', 'loc', 'instr', 'req', 'amc'].includes(currentView);

  return (
    <>
      <Layout>
        <Routes>
          <Route path="/tableau-de-bord" element={<section className="view active w-full h-full flex-1 flex flex-col"><Dashboard /></section>} />
          <Route path="/carte" element={<section className="view active w-full h-full flex-1 flex flex-col"><CarteView /></section>} />
          <Route path="/localiser" element={<section className="view active w-full h-full flex-1 flex flex-col"><Localiser /></section>} />
          <Route path="/instruction" element={<section className="view active w-full h-full flex-1 flex flex-col"><Instruction /></section>} />
          <Route path="/requetes" element={<section className="view active w-full h-full flex-1 flex flex-col"><Requetes /></section>} />
          <Route path="/modelisation" element={<section className="view active w-full h-full flex-1 flex flex-col"><AmcAhp /></section>} />
          <Route path="/mon-espace" element={<section className="view active w-full h-full flex-1 flex flex-col"><MonEspace /></section>} />
          <Route path="/catalogue" element={<section className="view active w-full h-full flex-1 flex flex-col"><Catalogue /></section>} />
          <Route path="/restitution" element={<section className="view active w-full h-full flex-1 flex flex-col"><Restitution /></section>} />
          <Route path="/administration" element={<section className="view active w-full h-full flex-1 flex flex-col"><Administration /></section>} />
          <Route path="/connexion" element={<section className="view active w-full h-full flex-1 flex flex-col"><LoginView /></section>} />
          <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
        </Routes>
      </Layout>
      <Toast />
      {hasMap && <MapPortal />}
    </>
  );
}

function MapPortal() {
  const { mapContainer } = useApp();

  if (!mapContainer) return null;
  return createPortal(<MapPanel />, mapContainer);
}

export { VIEW_PATHS, PATH_VIEWS };
