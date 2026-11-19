import type { Script } from '../lib/prototypes'

export function Prototype({ prototype, screen, onNavigate, onBack, busy }: {
  prototype: Script
  screen: string
  onNavigate?: (label: string, destination: string) => void
  onBack?: () => void
  busy?: boolean
}) {
  const view = prototype.screens[screen] ?? prototype.screens.home
  return <div className="prototype">
    <div className="prototype-brand">{prototype.name}</div>
    {onBack && <button type="button" disabled={busy} onClick={onBack}>← Back</button>}
    <h2>{view.title}</h2>
    {view.body && <p>{view.body}</p>}
    <div className="prototype-actions">
      {view.buttons.map(([label, destination]) => onNavigate
        ? <button type="button" key={label} disabled={busy} onClick={() => onNavigate(label, destination)}>{label}<span>→</span></button>
        : <div key={label}>{label}<span>→</span></div>)}
    </div>
  </div>
}
