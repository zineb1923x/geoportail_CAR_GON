export default function Pill({ cat, type, children }) {
  const cls = cat || type || '';
  return <span className={`pill ${cls}`}>{children}</span>;
}
