import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Eye, EyeOff, Lock, User, Shield } from 'lucide-react';

function Logo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <polygon points="32,3 61,18 61,46 32,61 3,46 3,18" fill="#1b7a45" />
      <polygon points="32,8 55,21 55,43 32,56 9,43 9,21" fill="#0b3d23" />
      <polygon points="32,16 48,26 48,40 32,50 16,40 16,26" fill="#c8a13a" opacity="0.85" />
      <polygon points="32,23 42,29 42,37 32,43 22,37 22,29" fill="#fdd835" opacity="0.9" />
    </svg>
  )
}

export default function LoginView() {
  const { login } = useApp();
  const [showPwd, setShowPwd] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const success = await login(username, password);
      if (!success) {
        setError('Identifiants incorrects.');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0b3d23] via-[#1b7a45] to-[#0b3d23] flex items-center justify-center p-4 absolute inset-0 z-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1.2px)', backgroundSize: '28px 28px' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header band */}
          <div className="bg-[#0b3d23] px-8 py-8 text-center">
            <div className="flex justify-center mb-4"><Logo /></div>
            <h1 className="text-white font-bold text-xl mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
              GéoPortail Agricole
            </h1>
            <p className="text-green-300 text-sm">Direction Régionale de l'Agriculture</p>
            <p className="text-green-400 text-xs mt-0.5">Guelmim-Oued Noun</p>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <p className="text-gray-500 text-sm mb-6 text-center">Connectez-vous à votre espace professionnel</p>
            
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200 text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Identifiant</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur ou CIN"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b7a45]/25 focus:border-[#1b7a45] transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Mot de passe</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b7a45]/25 focus:border-[#1b7a45] transition-all"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600">
                  <input type="checkbox" className="accent-[#1b7a45] rounded" />
                  Se souvenir de moi
                </label>
                <a href="#" className="text-[#1b7a45] hover:underline text-xs">Mot de passe oublié ?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1b7a45] hover:bg-[#166b3c] text-white font-semibold py-3 rounded-xl transition-all shadow-sm disabled:opacity-70 mt-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Connexion…
                  </span>
                ) : 'Se connecter'}
              </button>
            </form>

            {/* Security notice */}
            <div className="mt-6 flex items-start gap-2 bg-[#f0faf4] rounded-xl p-3">
              <Shield size={14} className="text-[#1b7a45] mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">Accès réservé aux agents autorisés de la DRA Guelmim-Oued Noun. Toute tentative non autorisée sera enregistrée.</p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-green-300 text-xs mt-4">
          Système d'Information Géographique Agricole · v2.5.0 · ISO 19115
        </p>
      </div>
    </div>
  );
}
