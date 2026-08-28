export default function Stepper({ steps, current, onStep }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const n = i + 1;
        const cls = n === current ? 'on' : n < current ? 'done' : '';
        return (
          <div key={n} className={`st ${cls}`} onClick={() => onStep && onStep(n)}>
            <span className="n">{n}</span>{label}
          </div>
        );
      })}
    </div>
  );
}
