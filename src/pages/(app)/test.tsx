import { useEffect, useRef, useState } from 'react'
import { AuthOverlay, useAuthProfileReady, useMutations, usePresenceRoom, useQuery } from 'deepspace'
import { Prototype } from '../../components/Prototype'
import { defaultPrompt, type Event } from '../../lib/replay'
import { defaultScript, readScript } from '../../lib/prototypes'
import '../../replay.css'

export default function TesterPage() {
  const { isSignedIn } = useAuthProfileReady({ requireUser: true })
  const [signIn, setSignIn] = useState(false)
  const { records, status } = useQuery<{ prompt: string; script?: string }>('study', { orderBy: 'createdAt', orderDir: 'desc' })
  const { createConfirmed } = useMutations<Event>('replay_events')
  const [run, setRun] = useState<{ id: string; prompt: string; step: number; script: string; path: string[] }>()
  const [screen, setScreen] = useState('home')
  const [finished, setFinished] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const prompt = run?.prompt ?? records[0]?.data.prompt ?? defaultPrompt

  const script = run?.script ?? records[0]?.data.script ?? defaultScript
  const prototype = readScript(script)

  async function record(action: string, destination: string, path: string[]) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    const id = run?.id ?? crypto.randomUUID()
    const step = (run?.step ?? -1) + 1
    try {
      await createConfirmed({ sessionId: id, step, action, from: screen, screen: destination, prompt, script: step === 0 ? script : undefined })
      setScreen(destination)
      setRun({ id, prompt, step, path, script })
      if (destination === 'done' || action === 'Ended session') setFinished(true)
    } catch {
      setError('This step could not be saved. Check your connection and try again.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return <section className="replay page tester">
    <div className="eyebrow">TESTER VIEW</div>
    <h1>{prototype.name}</h1>
    <div className="panel task"><strong>Your task</strong><p>{prompt}</p></div>
    <p>This study records the actions you take inside the prototype.</p>
    {error && <p role="alert">{error}</p>}
    {isSignedIn && status === 'error' && <p role="alert">The study could not load. Refresh and try again.</p>}
    {!isSignedIn && <button className="primary" onClick={() => setSignIn(true)}>Sign in to participate</button>}
    {isSignedIn && !run && <button className="primary" disabled={busy || status !== 'ready'} onClick={() => void record('Started session', 'home', ['home'])}>Start test</button>}
    {run && !finished && <TesterPresence id={run.id} />}
    {run && <Prototype screen={screen} prototype={prototype} busy={busy}
      onNavigate={finished ? undefined : (label, destination) => void record(label, destination, [...run.path, destination])}
      onBack={!finished && run.path.length > 1 ? () => void record('Back', run.path[run.path.length - 2], run.path.slice(0, -1)) : undefined} />}
    {run && !finished && <button className="secondary" disabled={busy} onClick={() => void record('Ended session', screen, run.path)}>End test</button>}
    {finished && <p role="status">Test saved. You can close this tab.</p>}
    {signIn && <AuthOverlay onClose={() => setSignIn(false)} />}
  </section>
}

function TesterPresence({ id }: { id: string }) {
  const { connected, updateState } = usePresenceRoom(`replay:${id}`)
  useEffect(() => {
    if (connected) updateState({ testing: true })
  }, [connected, updateState])
  return null
}
