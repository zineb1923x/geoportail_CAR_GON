import React, { useState } from 'react';
import { Download, FileText, BarChart2, Table, Printer, Calendar, Filter } from 'lucide-react';
import { Card, Button, Select, Input, CARBadge, SectionHeader, Badge } from '../ui/ui';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../../context/AppContext';

const barData = [
  { month: 'Mar', A: 312, B: 180, C: 92 },
  { month: 'Avr', A: 340, B: 175, C: 88 },
  { month: 'Mai', A: 380, B: 188, C: 79 },
  { month: 'Jun', A: 410, B: 192, C: 71 },
  { month: 'Jul', A: 455, B: 198, C: 64 },
  { month: 'Aoû', A: 482, B: 218, C: 56 },
];

const lineData = [
  { month: 'Mar', area: 18200 }, { month: 'Avr', area: 19800 },
  { month: 'Mai', area: 21300 }, { month: 'Jun', area: 22600 },
  { month: 'Jul', area: 23900 }, { month: 'Aoû', area: 24680 },
];

const pieData = [
  { name: 'CAR-A', value: 1742, color: '#4caf50' },
  { name: 'CAR-B', value: 983, color: '#ff9800' },
  { name: 'CAR-C', value: 441, color: '#f44336' },
];

const reports = [
  { name: 'Rapport Mensuel CAR — Juillet 2026', type: 'Mensuel', date: '01/08/2026', pages: 28, format: 'PDF' },
  { name: 'Bilan Semestriel S1 2026', type: 'Semestriel', date: '01/07/2026', pages: 64, format: 'PDF' },
  { name: 'Statistiques Communales — Juin 2026', type: 'Analytique', date: '05/07/2026', pages: 18, format: 'PDF' },
  { name: 'Export CAR-A Secteur N-04', type: 'Extraction', date: '12/07/2026', pages: null, format: 'CSV' },
  { name: 'Données SIG Hydro', type: 'Couche SIG', date: '10/07/2026', pages: null, format: 'SHP' },
];

export default function Restitution() {
  const { doExport, toast } = useApp();
  
  const [reportType, setReportType] = useState('monthly');
  const [commune, setCommune] = useState('all');
  const [period, setPeriod] = useState('2026-08');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    toast("Génération du rapport en cours...");
    
    try {
      const qs = new URLSearchParams({
        type: reportType,
        commune: commune,
        period: period,
        format: format
      });
      const res = await fetch(`http://localhost:8000/api/geodata/export/?${qs.toString()}`);
      
      if (res.ok) {
        if (format.startsWith('pdf') || format === 'csv') {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const ext = format.startsWith('pdf') ? 'pdf' : format;
          a.download = `Export_${reportType}_${commune}_${period}.${ext}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
        } else {
          // Fallback for mocks
          doExport(`Rapport ${reportType} - ${commune} (${period})`);
        }
        toast("✅ Rapport généré avec succès !");
      } else {
        toast("❌ Erreur lors de la génération du rapport.");
      }
    } catch(e) {
      toast("❌ Erreur réseau lors de la génération.");
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6 overflow-y-auto h-full scroll-area space-y-5" style={{ height: 'calc(100vh - 160px)' }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Rapports & Exports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Génération de rapports PDF, exports de données et visualisations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Generator form */}
        <Card className="p-5">
          <SectionHeader title="Générer un Rapport" />
          <div className="space-y-3 mt-4">
            <Select label="Type de rapport" value={reportType} onChange={setReportType} options={[
              { value: 'monthly', label: 'Rapport mensuel CAR' },
              { value: 'semester', label: 'Bilan semestriel' },
              { value: 'commune', label: 'Statistiques communales' },
              { value: 'parcel', label: 'Fiche parcellaire' },
              { value: 'planche', label: 'Planche réglementaire 1/25 000' },
              { value: 'model', label: 'Résultats modèle AHP' },
            ]} />
            
            {reportType === 'planche' ? (
              <Select label="Feuille (quadrillage régional)" value={commune} onChange={setCommune} options={[
                { value: 'guelmim-ne', label: 'Guelmim NE' },
                { value: 'guelmim-no', label: 'Guelmim NO' },
                { value: 'asrir', label: 'Asrir-Tighmert' },
                { value: 'bouizakarne', label: 'Bouizakarne' },
              ]} />
            ) : (
              <Select label="Commune / Zone" value={commune} onChange={setCommune} options={[
                { value: 'all', label: 'Toute la région' },
                { value: 'guelmim', label: 'Guelmim' },
                { value: 'tantan', label: 'Tan-Tan' },
                { value: 'assazag', label: 'Assa-Zag' },
                { value: 'sidiifni', label: 'Sidi Ifni' },
              ]} />
            )}
            
            <Input label="Période" type="month" value={period} onChange={setPeriod} />
            <Select label="Format de sortie" value={format} onChange={setFormat} options={[
              { value: 'pdf', label: 'PDF (rapport complet)' },
              { value: 'pdf-a0', label: 'PDF géoréférencé — A0' },
              { value: 'xlsx', label: 'Excel (.xlsx)' },
              { value: 'csv', label: 'CSV (données brutes)' },
              { value: 'shp', label: 'Shapefile (SHP)' },
            ]} />
            
            <div className="flex flex-col gap-1 mt-2">
              <label className="text-xs font-medium text-gray-700">Contenu à inclure</label>
              {['Cartes thématiques', 'Tableaux statistiques', 'Graphiques', 'Fiches parcellaires'].map(opt => (
                <label key={opt} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#1b7a45] rounded" />
                  {opt}
                </label>
              ))}
            </div>
            
            <Button className="w-full mt-4" onClick={generate} disabled={generating} icon={generating ? undefined : <FileText size={14} />}>
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Génération…
                </span>
              ) : 'Générer le rapport'}
            </Button>
          </div>
        </Card>

        {/* Charts */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <SectionHeader title="Évolution des Parcelles CAR" sub="Mars – Août 2026" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <RechartsTooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="A" name="CAR-A" fill="#4caf50" radius={[3, 3, 0, 0]} />
                <Bar dataKey="B" name="CAR-B" fill="#ff9800" radius={[3, 3, 0, 0]} />
                <Bar dataKey="C" name="CAR-C" fill="#f44336" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5">
              <SectionHeader title="Superficie Totale (ha)" />
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={lineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip formatter={(v) => v.toLocaleString('fr-FR') + ' ha'} />
                  <Line type="monotone" dataKey="area" stroke="#1b7a45" strokeWidth={2.5} dot={{ r: 4, fill: '#1b7a45', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <SectionHeader title="Répartition CAR" />
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      </div>

      {/* Past reports */}
      <Card className="p-5">
        <SectionHeader title="Rapports Générés" sub="Historique des 30 derniers jours"
          action={<Button variant="ghost" size="sm" icon={<Filter size={12} />}>Filtrer</Button>} />
        <div className="space-y-2 mt-4">
          {reports.map((rep, i) => (
            <div key={i} className="flex flex-wrap sm:flex-nowrap items-center gap-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition-colors">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                rep.format === 'PDF' ? 'bg-red-500' : rep.format === 'CSV' ? 'bg-green-600' : 'bg-amber-500'
              }`}>{rep.format}</div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm font-medium text-gray-900">{rep.name}</p>
                <p className="text-xs text-gray-400">{rep.date}{rep.pages ? ` · ${rep.pages} pages` : ''}</p>
              </div>
              <Badge color={rep.type === 'Mensuel' ? 'green' : rep.type === 'Semestriel' ? 'blue' : 'gray'} className="hidden sm:inline-flex">{rep.type}</Badge>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button className="p-2 text-[#1b7a45] hover:bg-[#f0faf4] rounded-lg transition-colors" title="Télécharger" onClick={() => toast(`Téléchargement de ${rep.name}...`)}>
                  <Download size={14} />
                </button>
                {rep.format === 'PDF' && (
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors" title="Imprimer">
                    <Printer size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
