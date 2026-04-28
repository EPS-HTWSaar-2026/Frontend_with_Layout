export default function StatusCard({ title, value, tone = "neutral", subtitle }) {
  return (
    <div className={`card tone-${tone}`}>
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      {subtitle ? <div className="card-subtitle">{subtitle}</div> : null}
    </div>
  );
}