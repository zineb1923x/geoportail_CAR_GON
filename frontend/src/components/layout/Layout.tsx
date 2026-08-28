import { useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import {
  Search, Bell, ChevronDown, Menu, X, LogOut, Settings, User, MapPin,
  LayoutDashboard, Layers, FileSearch, FileText, BarChart2, Calculator,
  Briefcase, Database, Download, Shield, HelpCircle
} from 'lucide-react'

type Page =
  | 'login' | 'dashboard' | 'map' | 'locate' | 'instruction'
  | 'queries' | 'amc' | 'workspace' | 'catalog' | 'reporting'
  | 'admin' | 'design-system'

const navGroups = [
  {
    label: 'Cartographie',
    icon: <Layers size={14} />,
    items: [
      { label: 'Carte & Couches', page: 'carte' as const, icon: <Layers size={13} /> },
      { label: 'Localiser une Parcelle', page: 'localiser' as const, icon: <MapPin size={13} /> },
      { label: 'Instruction de Parcelle', page: 'instruction' as const, icon: <FileText size={13} /> },
      { label: 'Requêtes & Analyses', page: 'requetes' as const, icon: <FileSearch size={13} /> },
    ],
  },
  {
    label: 'Modélisation',
    icon: <Calculator size={14} />,
    items: [
      { label: 'Modèle AMC/AHP', page: 'modelisation' as const, icon: <Calculator size={13} /> },
      { label: 'Rapports & Exports', page: 'restitution' as const, icon: <Download size={13} /> },
    ],
  },
  {
    label: 'Données',
    icon: <Database size={14} />,
    items: [
      { label: 'Catalogue de Données', page: 'catalogue' as const, icon: <Database size={13} /> },
    ],
  },
]

function Logo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <polygon points="18,2 34,10 34,26 18,34 2,26 2,10" fill="#1b7a45" />
      <polygon points="18,5 31,12 31,24 18,31 5,24 5,12" fill="#0b3d23" />
      <polygon points="18,10 27,15 27,23 18,28 9,23 9,15" fill="#c8a13a" opacity="0.85" />
      <polygon points="18,14 23,17 23,21 18,24 13,21 13,17" fill="#fdd835" opacity="0.9" />
    </svg>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, profile } = useApp()

  const currentPath = location.pathname.substring(1) || 'tableau-de-bord'

  const onNavigate = (path: string) => {
    navigate('/' + path)
    setMobileOpen(false)
  }

  const handleLogout = () => {
    if (logout) logout()
    navigate('/connexion')
  }

  return (
    <div className="flex flex-col h-screen bg-[#f8f9fa] w-full overflow-hidden">
      {/* ── Header ── */}
      <header className="bg-[#0b3d23] text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3 px-4 h-14">
          {/* Logo + Title */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => onNavigate('tableau-de-bord')}>
            <Logo />
            <div className="hidden sm:block leading-tight">
              <p className="text-[11px] text-green-300 font-medium tracking-wider uppercase">Direction Régionale de l'Agriculture</p>
              <p className="text-sm font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>GéoPortail Agricole — Guelmim-Oued Noun</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-300" />
              <input
                placeholder="Rechercher une parcelle, commune, titre foncier…"
                className="w-full bg-[#1b7a45]/40 border border-[#1b7a45] rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-green-300 outline-none focus:bg-[#1b7a45]/60 focus:border-green-400 transition-all"
              />
            </div>
          </div>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#fdd835] rounded-full" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-white/20 transition-all">
              <div className="w-6 h-6 rounded-full bg-[#c8a13a] flex items-center justify-center text-xs font-bold text-white">
                {profile ? profile.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block capitalize">{profile || 'Utilisateur'}</span>
            </div>
            <button className="p-2 hover:bg-white/10 text-red-300 rounded-lg transition-all hidden sm:flex" onClick={handleLogout} title="Déconnexion">
              <LogOut size={16} />
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Navbar ── */}
      <nav className="bg-[#1b7a45] text-white sticky top-14 z-30 shadow-sm hidden md:block">
        <div className="flex items-center gap-0 px-4">
          <NavBtn active={currentPath === 'tableau-de-bord'} onClick={() => onNavigate('tableau-de-bord')} icon={<LayoutDashboard size={13} />}>
            Tableau de bord
          </NavBtn>
          {navGroups.map(group => (
            <div key={group.label} className="relative"
              onMouseEnter={() => setOpenMenu(group.label)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <NavBtn active={false} onClick={() => {}} icon={group.icon}>
                <span>{group.label}</span>
                <ChevronDown size={11} className={`transition-transform ${openMenu === group.label ? 'rotate-180' : ''}`} />
              </NavBtn>
              {openMenu === group.label && (
                <div className="absolute top-full left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[200px] animate-fadeIn">
                  {group.items.map(item => (
                    <button
                      key={item.page}
                      onClick={() => { onNavigate(item.page); setOpenMenu(null) }}
                      className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors hover:bg-[#f0faf4] ${currentPath === item.page ? 'text-[#1b7a45] font-semibold bg-[#f0faf4]' : 'text-gray-700'}`}
                    >
                      <span className="text-[#1b7a45]">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <NavBtn active={currentPath === 'mon-espace'} onClick={() => onNavigate('mon-espace')} icon={<Briefcase size={13} />}>
            Mon Espace
          </NavBtn>
          <NavBtn active={currentPath === 'administration'} onClick={() => onNavigate('administration')} icon={<Shield size={13} />}>
            Administration
          </NavBtn>
        </div>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="bg-[#0b3d23] w-72 h-full p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <Logo />
              <button onClick={() => setMobileOpen(false)}><X size={20} className="text-white" /></button>
            </div>
            <MobileNavItem page={currentPath} target="tableau-de-bord" onNavigate={onNavigate} icon={<LayoutDashboard size={15} />} label="Tableau de bord" />
            {navGroups.map(g => g.items.map(item => (
              <MobileNavItem key={item.page} page={currentPath} target={item.page} onNavigate={onNavigate} icon={item.icon} label={item.label} />
            )))}
            <MobileNavItem page={currentPath} target="mon-espace" onNavigate={onNavigate} icon={<Briefcase size={15} />} label="Mon Espace" />
            <MobileNavItem page={currentPath} target="administration" onNavigate={onNavigate} icon={<Shield size={15} />} label="Administration" />
            <div className="border-t border-white/20 mt-4 pt-4">
              <button className="flex items-center gap-2 text-red-300 text-sm w-full px-3 py-2.5 hover:bg-white/10 rounded-lg" onClick={handleLogout}>
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
        <span className="text-[#1b7a45] font-medium cursor-pointer hover:underline" onClick={() => onNavigate('tableau-de-bord')}>Accueil</span>
        {currentPath !== 'tableau-de-bord' && currentPath !== 'connexion' && (
          <>
            <span>/</span>
            <span className="text-gray-700 font-medium capitalize">{pageLabel(currentPath)}</span>
          </>
        )}
      </div>

      {/* ── Content ── */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-[#f8f9fa]">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0b3d23] text-green-300 text-xs px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 z-40">
        <span>© 2026 Direction Régionale de l'Agriculture — Guelmim-Oued Noun. Tous droits réservés.</span>
        <span className="flex gap-3 text-green-400">
          <span>ISO 19115 · OGC WMS/WFS · EPSG:26192</span>
          <span>|</span>
          <span>v2.5.0</span>
        </span>
      </footer>
    </div>
  )
}

function NavBtn({ children, active, onClick, icon }: { children: ReactNode; active: boolean; onClick: () => void; icon?: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
        active ? 'border-[#fdd835] text-white bg-black/10' : 'border-transparent text-green-100 hover:text-white hover:bg-black/10'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function MobileNavItem({ page, target, onNavigate, icon, label }: { page: string; target: string; onNavigate: (p: string) => void; icon: ReactNode; label: string }) {
  return (
    <button
      onClick={() => onNavigate(target)}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${page === target ? 'bg-[#1b7a45] text-white font-semibold' : 'text-green-200 hover:bg-white/10'}`}
    >
      {icon} {label}
    </button>
  )
}

function pageLabel(path: string): string {
  const labels: Record<string, string> = {
    'connexion': 'Connexion', 'tableau-de-bord': 'Tableau de bord', 'carte': 'Carte & Couches',
    'localiser': 'Localiser une Parcelle', 'instruction': 'Instruction de Parcelle',
    'requetes': 'Requêtes & Analyses', 'modelisation': 'Modèle AMC/AHP', 'mon-espace': 'Mon Espace',
    'catalogue': 'Catalogue de Données', 'restitution': 'Rapports & Exports',
    'administration': 'Administration',
  }
  return labels[path] ?? path
}
