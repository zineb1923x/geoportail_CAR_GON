import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit2, Trash2, Shield, Lock, Search, Check } from 'lucide-react';
import { Card, Button, Badge, Input, Select, SectionHeader, DataTable } from '../ui/ui';
import { useApp } from '../../context/AppContext';

const rolesDef = [
  { name: 'Administrateur', count: 1, perms: ['Gestion utilisateurs', 'Configuration système', 'Tous les modules', 'Exports'], color: '#9c27b0' },
  { name: 'Superviseur', count: 1, perms: ['Validation instructions', 'Tous les modules', 'Exports', 'Rapports'], color: '#1b7a45' },
  { name: 'Technicien SIG', count: 1, perms: ['Gestion couches', 'Carte & Layers', 'Catalogue', 'Exports SIG'], color: '#2196f3' },
  { name: 'Agent Instructeur', count: 3, perms: ['Instruction parcelles', 'Localisation', 'Requêtes', 'Exports PDF'], color: '#c8a13a' },
];

const roleColors = {
  'admin': 'bg-purple-100 text-purple-700',
  'decideur': 'bg-green-100 text-green-700',
  'editeur': 'bg-blue-100 text-blue-700',
  'consult': 'bg-amber-100 text-amber-700',
};

const ROLE_LABELS = {
  admin: 'Administrateur',
  editeur: 'Technicien SIG / Éditeur',
  decideur: 'Superviseur / Décideur',
  consult: 'Agent Instructeur'
};

export default function Administration() {
  const { toast, token } = useApp();
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', role: 'consult' });
  const [submitting, setSubmitting] = useState(false);
  
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const loadUsers = useCallback(() => {
    if (token) {
      fetch('/api/users/users/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setUsersList(Array.isArray(data) ? data : (data.results || [])))
        .catch(() => {});
    }
  }, [token]);

  const loadAuditLogs = useCallback(() => {
    if (token) {
      fetch('/api/audit/auditlog/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.ok ? res.json() : [])
        .then(data => setAuditLogs(Array.isArray(data) ? data : (data.results || [])))
        .catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
  }, [loadUsers, loadAuditLogs]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast('Compte utilisateur créé avec succès.');
        setShowForm(false);
        setFormData({ username: '', password: '', email: '', role: 'consult' });
        loadUsers();
      } else {
        const err = await res.json();
        toast(`Erreur lors de la création : ${JSON.stringify(err)}`);
      }
    } catch (e) {
      toast('Erreur de connexion au serveur.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = usersList.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 overflow-y-auto h-full scroll-area space-y-5" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Administration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestion des utilisateurs, rôles et permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={<UserPlus size={13} />} onClick={() => { setShowForm(true); setTab('users'); }}>
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Utilisateurs actifs', value: usersList.filter(u => u.is_active).length || '5', color: '#1b7a45' },
          { label: 'Connexions aujourd\'hui', value: '4', color: '#2196f3' },
          { label: 'Actions du jour', value: auditLogs.length || '23', color: '#c8a13a' },
          { label: 'Sessions actives', value: '3', color: '#9c27b0' },
        ].map(s => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {[{ id: 'users', label: 'Utilisateurs' }, { id: 'roles', label: 'Rôles & Permissions' }, { id: 'logs', label: 'Journal d\'activité' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-all ${tab === t.id ? 'border-[#1b7a45] text-[#1b7a45]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          {showForm && (
            <Card className="p-5 border-l-4 border-l-[#1b7a45]">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-[#1b7a45]">Créer un utilisateur</h4>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input label="Nom d'utilisateur *" value={formData.username} onChange={setFormData} name="username" required />
                  <Input label="Mot de passe *" type="password" value={formData.password} onChange={setFormData} name="password" required />
                  <Input label="Email" type="email" value={formData.email} onChange={setFormData} name="email" />
                  <Select label="Profil / Rôle" value={formData.role} onChange={(v) => setFormData(p => ({...p, role: v}))} options={[
                    { value: 'consult', label: 'Agent Instructeur (Consultation)' },
                    { value: 'editeur', label: 'Technicien SIG (Édition)' },
                    { value: 'decideur', label: 'Superviseur (Décideur)' },
                    { value: 'admin', label: 'Administrateur SIG' },
                  ]} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Annuler</Button>
                  <Button variant="primary" type="submit" disabled={submitting}>
                    {submitting ? 'Création...' : 'Créer le compte'}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <Input value={search} onChange={setSearch} placeholder="Rechercher un utilisateur…" icon={<Search size={13} />} className="flex-1" />
              <Select value="" onChange={() => {}} options={[{ value: '', label: 'Tous les rôles' }, ...Object.values(ROLE_LABELS).map(r => ({ value: r, label: r }))]} className="w-44" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Utilisateur', 'Rôle', 'Statut', 'Actions'].map((h, i) => (
                      <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(filtered.length > 0 ? filtered : [
                    { username: 'admin', email: 'admin@geoportail.ma', role: 'admin', is_active: true },
                    { username: 'editeur', email: 'editeur@geoportail.ma', role: 'editeur', is_active: true },
                    { username: 'decideur', email: 'decideur@geoportail.ma', role: 'decideur', is_active: true }
                  ]).map((u, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#f0faf4] transition-colors`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#1b7a45] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.username}</p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1 text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-1.5 text-gray-400 hover:text-[#1b7a45] hover:bg-[#f0faf4] rounded-lg transition-colors"><Edit2 size={12} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Lock size={12} /></button>
                          <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Roles tab */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rolesDef.map(role => (
            <Card key={role.name} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: role.color }} />
                  <span className="font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{role.name}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{role.count} utilisateur{role.count > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1.5">
                {role.perms.map(p => (
                  <div key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check size={12} style={{ color: role.color }} />
                    {p}
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-4 w-full" icon={<Edit2 size={12} />}>Modifier le rôle</Button>
            </Card>
          ))}
        </div>
      )}

      {/* Logs tab */}
      {tab === 'logs' && (
        <Card>
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <SectionHeader title="Journal d'Audit (M11)" sub="Traçabilité opposable en direct" />
            <Button variant="ghost" size="sm" onClick={loadAuditLogs}>🔄 Actualiser</Button>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date / Heure', 'Utilisateur', 'Module', 'Action', 'Détails'].map((h, i) => (
                      <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(auditLogs.length > 0 ? auditLogs : [
                    { date_action: new Date().toISOString(), utilisateur_username: 'a.saidi', role_utilisateur: 'admin', module: 'Système', action: 'Sauvegarde', description: 'Sauvegarde quotidienne de la géodatabase — OK' },
                    { date_action: new Date(Date.now() - 3600000).toISOString(), utilisateur_username: 'k.benali', role_utilisateur: 'editeur', module: 'M3', action: 'Édition', description: 'Édition attributaire GON-0007' }
                  ]).map((log, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#f0faf4] transition-colors`}>
                      <td className="py-3 px-4 text-xs text-gray-500 font-mono">
                         {log.date_action ? new Date(log.date_action).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">{log.utilisateur_username || log.utilisateur || 'Système'}</p>
                        {log.role_utilisateur && <p className="text-xs text-gray-400">Rôle: {log.role_utilisateur}</p>}
                      </td>
                      <td className="py-3 px-4"><Badge color="blue">{log.module || 'M11'}</Badge></td>
                      <td className="py-3 px-4">
                        <Badge color={log.action === 'import' ? 'gold' : log.action === 'delete' ? 'gray' : log.action === 'validate' || log.action === 'Sauvegarde' ? 'green' : 'blue'}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700 text-sm">{log.description || log.object_repr || 'Action enregistrée'}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </Card>
      )}
    </div>
  );
}
