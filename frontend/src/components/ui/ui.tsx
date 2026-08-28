import { type ReactNode, type CSSProperties } from 'react'

// ── Badge / Pill ──────────────────────────────────────────────────────────────
type CARCategory = 'A' | 'B' | 'C'
const carColors: Record<CARCategory, string> = {
  A: 'bg-[#e8f5e9] text-[#2e7d32] border-[#4caf50]',
  B: 'bg-[#fff3e0] text-[#e65100] border-[#ff9800]',
  C: 'bg-[#ffebee] text-[#c62828] border-[#f44336]',
}
export function CARBadge({ cat }: { cat: CARCategory }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${carColors[cat]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat === 'A' ? '#4caf50' : cat === 'B' ? '#ff9800' : '#f44336' }} />
      CAR {cat}
    </span>
  )
}

export function Badge({ children, color = 'gray' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-800',
    gold: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-700',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>{children}</span>
}

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
interface BtnProps {
  children: ReactNode
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
  icon?: ReactNode
}
const btnBase = 'inline-flex items-center justify-center gap-2 font-medium rounded-[9px] transition-all duration-150 cursor-pointer border select-none whitespace-nowrap'
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-[#1b7a45] border-[#1b7a45] text-white hover:bg-[#166b3c] hover:border-[#166b3c] shadow-sm',
  secondary: 'bg-[#0b3d23] border-[#0b3d23] text-white hover:bg-[#092e1a] shadow-sm',
  outline: 'bg-white border-[#1b7a45] text-[#1b7a45] hover:bg-[#f0faf4]',
  ghost: 'bg-transparent border-transparent text-[#374151] hover:bg-gray-100',
  danger: 'bg-[#f44336] border-[#f44336] text-white hover:bg-[#d32f2f] shadow-sm',
}
const btnSizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' }
export function Button({ children, variant = 'primary', size = 'md', onClick, disabled, className = '', type = 'button', icon }: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  type?: string
  error?: string
  hint?: string
  icon?: ReactNode
  className?: string
  disabled?: boolean
}
export function Input({ label, placeholder, value, onChange, type = 'text', error, hint, icon, className = '', disabled }: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full border rounded-[9px] py-2 text-sm text-gray-900 placeholder:text-gray-400 bg-white transition-all outline-none
            focus:ring-2 focus:ring-[#1b7a45]/20 focus:border-[#1b7a45]
            ${error ? 'border-red-400' : 'border-gray-200'}
            ${icon ? 'pl-9 pr-3' : 'px-3'}
            ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}
          `}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function Select({ label, value, onChange, options, className = '' }: {
  label?: string; value?: string; onChange?: (v: string) => void;
  options: { value: string; label: string }[]; className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={e => onChange?.(e.target.value)}
        className="w-full border border-gray-200 rounded-[9px] py-2 px-3 text-sm text-gray-900 bg-white outline-none focus:ring-2 focus:ring-[#1b7a45]/20 focus:border-[#1b7a45] transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`} style={style}>
      {children}
    </div>
  )
}

export function KPICard({ label, value, sub, color, icon, trend }: {
  label: string; value: string; sub?: string; color: string; icon: ReactNode; trend?: string
}) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <span className={`p-2 rounded-lg ${color}`}>{icon}</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {trend && <p className="text-xs text-green-600 font-medium">{trend}</p>}
    </Card>
  )
}

// ── DataTable ─────────────────────────────────────────────────────────────────
export function DataTable({ columns, rows, onRowClick }: {
  columns: string[]
  rows: (string | ReactNode)[][]
  onRowClick?: (i: number) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map((col, i) => (
              <th key={i} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              onClick={() => onRowClick?.(ri)}
              className={`border-b border-gray-50 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-[#f0faf4] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="py-3 px-4 text-gray-700">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────────────────────────
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
              i < current ? 'bg-[#1b7a45] border-[#1b7a45] text-white' :
              i === current ? 'bg-white border-[#1b7a45] text-[#1b7a45]' :
              'bg-white border-gray-200 text-gray-400'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-[#1b7a45]' : i < current ? 'text-gray-600' : 'text-gray-400'}`}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-3 transition-all ${i < current ? 'bg-[#1b7a45]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Outfit, sans-serif' }}>{title}</h2>
        {sub && <p className="text-sm text-gray-500 mt-0.5">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

// ── StatusDot ─────────────────────────────────────────────────────────────────
export function StatusDot({ color }: { color: string }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
}
