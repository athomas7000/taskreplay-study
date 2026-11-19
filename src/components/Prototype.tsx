import { isCafePrototype, isStudioPrototype, type Script } from '../lib/prototypes'
import { StudioApp } from './StudioApp'
import { MatchaApp } from './MatchaApp'

export type PrototypeProps = {
  prototype: Script
  screen: string
  onNavigate?: (label: string, destination: string) => void
  onBack?: () => void
  busy?: boolean
  actions?: readonly string[]
  readonly?: boolean
  replayTarget?: string
}

export function Prototype(props: PrototypeProps) {
  const { prototype, screen, onNavigate, onBack, busy } = props
  if (isCafePrototype(prototype) && Object.hasOwn(prototype.screens, screen)) return <MatchaApp {...props} />
  if (isStudioPrototype(prototype) && Object.hasOwn(prototype.screens, screen)) return <StudioApp {...props} />
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
