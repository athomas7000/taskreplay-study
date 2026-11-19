import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Coffee, RotateCcw, ShoppingBag } from 'lucide-react'
import { AuthOverlay, useAuthProfileReady, useMutations, usePresenceRoom, useQuery } from 'deepspace'
import { Prototype } from '../../components/Prototype'
import { defaultPrompt, type Event } from '../../lib/replay'
import { cafe, defaultScript, isCafePrototype, isStudioPrototype, projectForScript, readScript, studio } from '../../lib/prototypes'
import { canManageStudy } from '../../lib/study-roles'
import '../../replay.css'

export default function TesterPage() {
  const [params] = useSearchParams()
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  const [sampleOpen, setSampleOpen] = useState(false)
  const [signIn, setSignIn] = useState(false)
  const project = params.get('project')

  if (params.get('preview') === '1') {
    if (user && canManageStudy(user.role)) return <RecordedTester key={params.toString()} preview onSample={() => setSampleOpen(true)} />
    return <section className="replay page">
      <h1>Study preview</h1>
      <p>{isSignedIn && !user ? 'Loading your profile…' : 'Sign in as a study manager to preview a study.'}</p>
      <Link to="/home">Go to study dashboard</Link>
    </section>
  }

  if (!isSignedIn || sampleOpen) return <>
    <SampleTester key={project} initial={project === 'apparel' ? 'apparel' : 'cafe'}
      onContinue={isSignedIn ? () => setSampleOpen(false) : () => setSignIn(true)}
      continueLabel={isSignedIn ? 'Back to study test' : 'Join a study'} />
    {signIn && !isSignedIn && <AuthOverlay onClose={() => setSignIn(false)} />}
  </>
  return <RecordedTester key={params.toString()} onSample={() => setSampleOpen(true)} />
}

function SampleTester({ initial, onContinue, continueLabel }: {
  initial: 'cafe' | 'apparel'
  onContinue: () => void
  continueLabel: string
}) {
  const [example, setExample] = useState(initial)
  const [path, setPath] = useState(['home'])
  const [actions, setActions] = useState<string[]>([])
  const screen = path.at(-1) ?? 'home'
  const finished = screen === 'done'
  const prototype = example === 'cafe' ? cafe : studio
  const task = example === 'cafe'
    ? 'Reorder your usual matcha for pickup at 12:30 PM.'
    : 'Add an I ❤️ SDKs Tee and a Starburst Crewneck to your bag, then select Finish cart task.'

  function reset() {
    setPath(['home'])
    setActions([])
  }

  return <section className="replay tester-sample">
    <div className="tester-sample-intro">
      <p className="eyebrow">Tester View</p>
      <h1>Help make an app <em>easier to use.</em></h1>
      <p>Try a task the way you normally would. Where you pause or go back helps the team understand what needs to change.</p>
      <ol className="role-steps" aria-label="How Tester View works">
        <li><strong>Read the task.</strong> A study link takes you to the task you’ve been asked to try.</li>
        <li><strong>Use the prototype.</strong> Pick a sample below to practice without an account.</li>
        <li><strong>Complete the task.</strong> Study runs share your actions with the manager. Practice runs stay in this tab.</li>
      </ol>
      <div className="tester-sample-options" role="group" aria-label="Sample prototypes">
        <button type="button" aria-pressed={example === 'cafe'} onClick={() => { setExample('cafe'); reset() }}><Coffee size={17} aria-hidden="true" /> Deep Space Café</button>
        <button type="button" aria-pressed={example === 'apparel'} onClick={() => { setExample('apparel'); reset() }}><ShoppingBag size={17} aria-hidden="true" /> DeepSpace Apparel</button>
      </div>
      <div className="panel tester-sample-task">
        <strong>Sample task</strong>
        <p>{task}</p>
        {finished && <p role="status">Sample complete. You can start over or try the other project.</p>}
      </div>
      <div className="tester-sample-actions">
        <button className="primary" type="button" onClick={onContinue}>{continueLabel} <ArrowRight size={16} aria-hidden="true" /></button>
        <button className="secondary" type="button" onClick={reset} disabled={path.length === 1 && !actions.length}><RotateCcw size={15} aria-hidden="true" /> Start over</button>
      </div>
    </div>
    <div className="tester-sample-preview">
      <Prototype prototype={prototype} screen={screen} actions={actions}
        onNavigate={finished ? undefined : (action, destination) => {
          setActions(previous => [...previous, action])
          setPath(previous => [...previous, destination])
        }}
        onBack={!finished && path.length > 1 ? () => setPath(previous => previous.slice(0, -1)) : undefined} />
    </div>
  </section>
}

function RecordedTester({ onSample, preview = false }: { onSample: () => void; preview?: boolean }) {
  const [params] = useSearchParams()
  const folder = params.get('project')
  const testId = params.get('test')
  const { records, status } = useQuery<{ prompt: string; script?: string }>('study', { orderBy: 'createdAt', orderDir: 'desc' })
  const { createConfirmed } = useMutations<Event>('replay_events')
  const [run, setRun] = useState<{ id: string; prompt: string; step: number; script: string; path: string[]; actions: string[] }>()
  const [screen, setScreen] = useState('home')
  const [finished, setFinished] = useState(false)
  const [editUntil, setEditUntil] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const published = testId
    ? records.find(record => record.recordId === testId && (!folder || projectForScript(record.data.script) === folder))
    : records.find(record => !folder || projectForScript(record.data.script) === folder)
  const unavailable = !run && status === 'ready' && (testId || folder === 'custom') && !published
  const prompt = run?.prompt ?? published?.data.prompt ?? (folder === 'apparel' ? 'Order an I ❤️ SDKs Tee in a size Medium.' : defaultPrompt)

  const script = run?.script ?? published?.data.script ?? (folder === 'apparel' ? JSON.stringify(studio) : defaultScript)
  const prototype = readScript(script)

  const cafeOrder = isCafePrototype(prototype)
  const apparelOrder = isStudioPrototype(prototype)

  function editOrder() {
    if (Date.now() >= editUntil) return
    const path = cafeOrder ? ['home', 'pickup'] : ['home', 'bag']
    void record('Edit order', path[path.length - 1], path)
  }

  async function record(action: string, destination: string, path: string[]) {
    if (saving.current) return
    saving.current = true
    setBusy(true)
    setError('')
    const id = run?.id ?? crypto.randomUUID()
    const step = (run?.step ?? -1) + 1
    try {
      if (!preview) await createConfirmed({ sessionId: id, step, action, from: screen, screen: destination, prompt, script: step === 0 ? script : undefined })
      setScreen(destination)
      setRun({ id, prompt, step, path, script, actions: [...(run?.actions ?? []), action] })
      setFinished(destination === 'done' || action === 'Ended session')
      setEditUntil(action === 'Confirm Pickup' && cafeOrder || action === 'Place order' && apparelOrder
        ? Date.now() + 30_000 : 0)
    } catch {
      setError('This step could not be saved. Check your connection and try again.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return <section className="replay page tester">
    {preview && <Link className="project-back" to={folder ? `/home?project=${encodeURIComponent(folder)}` : '/home'}>← Back to studies</Link>}
    <div className="eyebrow">{preview ? 'MANAGER PREVIEW' : 'TESTER VIEW'}</div>
    <h1>{cafeOrder ? 'Deep Space Café' : apparelOrder ? 'DeepSpace Apparel' : prototype.name}</h1>
    <div className="panel task"><strong>Your task</strong><p>{prompt}</p></div>
    <p>{preview ? 'Try the task as a tester. Preview actions stay in this tab.' : 'This study records the actions you take inside the prototype.'}</p>
    {error && <p role="alert">{error}</p>}
    {status === 'error' && <p role="alert">The study could not load. Refresh and try again.</p>}
    {unavailable && <p role="alert">This usability test is unavailable.</p>}
    {!run && !unavailable && <button className="primary" disabled={busy || status !== 'ready'} onClick={() => void record('Started session', 'home', ['home'])}>{preview ? 'Start preview' : 'Start test'}</button>}
    {!preview && run && !finished && <TesterPresence id={run.id} />}
    {run && <Prototype screen={screen} prototype={prototype} busy={busy} actions={run.actions}
      onNavigate={finished ? undefined : (label, destination) => void record(label, destination, [...run.path, destination])}
      onBack={!finished && run.path.length > 1 ? () => void record('Back', run.path[run.path.length - 2], run.path.slice(0, -1)) : undefined} />}
    {run && !finished && <button className="secondary" disabled={busy} onClick={() => void record('Ended session', screen, run.path)}>End test</button>}
    {finished && (editUntil
      ? <OrderEditWindow key={editUntil} deadline={editUntil} onEdit={editOrder} busy={busy} preview={preview} />
      : <p role="status">{preview ? 'Preview ended.' : 'Test saved. You can close this tab.'}</p>)}
    {!preview && !run && <button className="secondary" type="button" onClick={onSample}>Try a sample</button>}
    {preview && run && <button className="secondary" type="button" onClick={() => {
      setRun(undefined)
      setScreen('home')
      setFinished(false)
      setEditUntil(0)
    }}>Restart preview</button>}
  </section>
}

function TesterPresence({ id }: { id: string }) {
  const { connected, updateState } = usePresenceRoom(`replay:${id}`)
  useEffect(() => {
    if (connected) updateState({ testing: true })
  }, [connected, updateState])
  return null
}

function OrderEditWindow({ deadline, onEdit, busy, preview }: { deadline: number; onEdit: () => void; busy: boolean; preview: boolean }) {
  const secondsLeft = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
  const [seconds, setSeconds] = useState(secondsLeft)

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(remaining)
      if (!remaining) window.clearInterval(timer)
    }, 250)
    return () => window.clearInterval(timer)
  }, [deadline])

  return seconds > 0
    ? <button className="secondary order-edit" type="button" disabled={busy} onClick={onEdit}>Edit order · {seconds}s left</button>
    : <p role="status">{preview ? 'Preview complete.' : 'Edit window closed. Test saved.'}</p>
}
