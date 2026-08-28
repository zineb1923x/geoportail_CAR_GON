import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { Layers, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Download, RefreshCw } from 'lucide-react'
import { Card, CARBadge, Badge, Button, DataTable, StatusDot, SectionHeader } from '../ui/ui'

const sparkA = [{ v: 1200 }, { v: 1380 }, { v: 1290 }, { v: 1400 }, { v: 1520 }, { v: 1610 }, { v: 1742 }]
const sparkB = [{ v: 890 }, { v: 920 }, { v: 870 }, { v: 940 }, { v: 980 }, { v: 1010 }, { v: 983 }]
const sparkC = [{ v: 640 }, { v: 590 }, { v: 610 }, { v: 540 }, { v: 500 }, { v: 465 }, { v: 441 }]
const sparkTotal = [{ v: 21400 }, { v: 22100 }, { v: 22800 }, { v: 23200 }, { v: 23900 }, { v: 24100 }, { v: 24680 }]

function Spark({ data, color }: { data: { v: number }[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={44}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`sg${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip formatter={(v: number) => v.toLocaleString('fr-FR')} contentStyle={{ fontSize: 11, borderRadius: 6, padding: '2px 8px' }} />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#sg${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function KPICard({ label, value, sub, color, icon, spark, sparkColor, trend }: {
  label: string; value: string; sub: string; color: string; icon: React.ReactNode;
  spark: { v: number }[]; sparkColor: string; trend: string
}) {
  return (
    <Card className="p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold mt-1.5" style={{ fontFamily: 'Outfit, sans-serif', color }}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
        </div>
        <span className="p-2.5 rounded-xl" style={{ background: color + '18' }}>{icon}</span>
      </div>
      <Spark data={spark} color={sparkColor} />
      <p className="text-xs font-medium" style={{ color: sparkColor }}>{trend}</p>
    </Card>
  )
}

const recentActivity = [
  { time: '09:42', type: 'Instruction', parcel: 'TF-24/Guelmim', cat: 'A' as const, user: 'K. Ait Brahim', status: 'Validé' },
  { time: '09:15', type: 'Requête SIG', parcel: 'Commune Asrir', cat: 'B' as const, user: 'F. Moussaid', status: 'En cours' },
  { time: '08:50', type: 'Export PDF', parcel: 'TF-109/Tan-Tan', cat: 'C' as const, user: 'A. Benali', status: 'Terminé' },
  { time: '08:30', type: 'Modèle AHP', parcel: 'Secteur N-12', cat: 'A' as const, user: 'M. El Idrissi', status: 'Calculé' },
  { time: '07:58', type: 'Instruction', parcel: 'TF-67/Assa', cat: 'B' as const, user: 'L. Benhssain', status: 'Révisé' },
  { time: '07:30', type: 'Localisation', parcel: 'Commune Fask', cat: 'A' as const, user: 'S. Zaydani', status: 'Localisé' },
]

const alertsData = [
  { sev: 'high', msg: '12 parcelles CAR-C signalées en zone d\'inondation (Oued Noun)', date: '18/08/2026' },
  { sev: 'med', msg: 'Mise à jour des orthophotos 2025 disponible pour import', date: '17/08/2026' },
  { sev: 'low', msg: 'Rapport mensuel CAR — juillet 2026 prêt pour validation', date: '16/08/2026' },
]

const communeStats = [
  ['Guelmim', '482', '218', '94', '78 420', <CARBadge cat="A" />],
  ['Tan-Tan', '341', '174', '63', '54 180', <CARBadge cat="A" />],
  ['Assa-Zag', '298', '121', '89', '41 230', <CARBadge cat="B" />],
  ['Sidi Ifni', '214', '98', '71', '29 750', <CARBadge cat="B" />],
  ['Asrir', '187', '73', '124', '22 100', <CARBadge cat="C" />],
]

export default function Dashboard() {
  return (
    <div className="p-6 overflow-y-auto h-full scroll-area space-y-6">
      {/* Welcome bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Tableau de bord — Classification Agricole Régionale
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Guelmim-Oued Noun · Lundi 18 août 2026 · Campagne 2025/2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={13} />}>Actualiser</Button>
          <Button variant="primary" size="sm" icon={<Download size={13} />}>Exporter</Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Parcelles CAR-A" value="1 742" sub="terres agricoles excellentes"
          color="#2e7d32" icon={<CheckCircle size={18} color="#4caf50" />}
          spark={sparkA} sparkColor="#4caf50" trend="↑ +8.2% vs campagne précédente"
        />
        <KPICard
          label="Parcelles CAR-B" value="983" sub="terres agricoles bonnes"
          color="#e65100" icon={<TrendingUp size={18} color="#ff9800" />}
          spark={sparkB} sparkColor="#ff9800" trend="→ Stable (±1.4%)"
        />
        <KPICard
          label="Parcelles CAR-C" value="441" sub="terres à améliorer"
          color="#c62828" icon={<AlertTriangle size={18} color="#f44336" />}
          spark={sparkC} sparkColor="#f44336" trend="↓ −13.1% après intervention"
        />
        <KPICard
          label="Superficie Totale" value="24 680 ha" sub="surface instruite 2026"
          color="#1b7a45" icon={<Layers size={18} color="#1b7a45" />}
          spark={sparkTotal} sparkColor="#1b7a45" trend="↑ +580 ha nouvelles parcelles"
        />
      </div>

      {/* Row 2: Activity + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity timeline */}
        <Card className="lg:col-span-2 p-5">
          <SectionHeader title="Activité récente" sub="Opérations des 24 dernières heures"
            action={<Button variant="ghost" size="sm" icon={<ArrowRight size={13} />}>Tout voir</Button>} />
          <div className="space-y-0">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400 font-mono w-10 shrink-0">{item.time}</span>
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.cat === 'A' ? '#4caf50' : item.cat === 'B' ? '#ff9800' : '#f44336' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium truncate">{item.type} — <span className="text-gray-500">{item.parcel}</span></p>
                  <p className="text-xs text-gray-400">{item.user}</p>
                </div>
                <CARBadge cat={item.cat} />
                <Badge color={item.status === 'Validé' || item.status === 'Terminé' || item.status === 'Localisé' ? 'green' : item.status === 'En cours' ? 'blue' : 'gold'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Alerts */}
        <Card className="p-5">
          <SectionHeader title="Alertes & Notifications" sub="3 nouvelles alertes" />
          <div className="space-y-3">
            {alertsData.map((a, i) => (
              <div key={i} className={`p-3 rounded-xl border-l-4 ${
                a.sev === 'high' ? 'bg-red-50 border-red-400' :
                a.sev === 'med' ? 'bg-amber-50 border-amber-400' :
                'bg-green-50 border-green-400'
              }`}>
                <p className="text-sm text-gray-800 leading-snug">{a.msg}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock size={10} /> {a.date}</p>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Répartition CAR</p>
            {[{ cat: 'CAR-A', pct: 56, color: '#4caf50' }, { cat: 'CAR-B', pct: 32, color: '#ff9800' }, { cat: 'CAR-C', pct: 12, color: '#f44336' }].map(c => (
              <div key={c.cat} className="flex items-center gap-2 mb-2">
                <span className="text-xs w-12 text-gray-600">{c.cat}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
                <span className="text-xs text-gray-500 w-8 text-right">{c.pct}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: Table */}
      <Card>
        <div className="p-5 border-b border-gray-100">
          <SectionHeader title="Statistiques par Commune" sub="Données actualisées au 18/08/2026"
            action={<Button variant="outline" size="sm" icon={<Download size={13} />}>CSV</Button>} />
        </div>
        <DataTable
          columns={['Commune', 'CAR-A', 'CAR-B', 'CAR-C', 'Superficie (ha)', 'Dominante']}
          rows={communeStats}
        />
        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Affichage 1–5 sur 23 communes</span>
          <div className="flex gap-1">
            {[1,2,3,'…',5].map((p, i) => (
              <button key={i} className={`w-7 h-7 rounded text-xs font-medium ${p === 1 ? 'bg-[#1b7a45] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{p}</button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
