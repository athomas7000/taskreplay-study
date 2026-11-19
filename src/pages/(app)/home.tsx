import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CirclePlay, Plus } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { AuthOverlay, useAuthProfileReady, useMutations, usePresenceRoom, useQuery } from 'deepspace'
import { Prototype } from '../../components/Prototype'
import { Button, Modal } from '../../components/ui'
import { SampleReplay } from '../../components/SampleReplay'
import { defaultPrompt, findFriction, groupSessions, outcome, shortestCompletedPath, type Event } from '../../lib/replay'
import { cafe, studio, defaultScript, isCafePrototype, parseScript, projectForScript, projectNames, readScript, type Project } from '../../lib/prototypes'
import { canManageStudy } from '../../lib/study-roles'
import '../../replay.css'

export default function StudyPage() {
  const [signIn, setSignIn] = useState(false)
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  if (!isSignedIn) return <section className="replay study-welcome">
    <div className="study-welcome-copy">
      <p className="study-welcome-brand"><CirclePlay size={21} aria-hidden="true" /> Manager View</p>
      <h1>Get to know <em>your customers and users.</em></h1>
      <p>See where customers hesitate or backtrack before you ship a change. Give testers a task and watch what they do.</p>
      <div className="study-welcome-actions">
        <button className="primary" type="button" onClick={() => setSignIn(true)}>Open study dashboard <ArrowRight size={16} aria-hidden="true" /></button>
        <a href="#sample-replay">Try a sample replay</a>
        <Link to="/research">Why usability testing matters</Link>
      </div>
      <ol className="role-steps" aria-label="How Manager View works">
        <li><strong>Publish a task.</strong> Choose a project and write what the tester should try.</li>
        <li><strong>Share the link.</strong> Watch the tester’s steps arrive as they happen.</li>
        <li><strong>Review the replay.</strong> Find the step that caused trouble and decide what to change.</li>
      </ol>
    </div>
    <SampleReplay />
    {signIn && <AuthOverlay onClose={() => setSignIn(false)} />}
  </section>
  if (!user) return <section className="replay page"><p>Loading your profile…</p></section>
  if (!canManageStudy(user.role)) return <section className="replay page"><h1>Study dashboard</h1><p>The app administrator manages this study.</p><Link className="primary" to="/test">Go to tester view</Link></section>
  return <Dashboard userId={user.id} canConfigureAccess={user.role === 'admin'} />
}

const projects = ['cafe', 'apparel', 'custom'] as const
const presets = {
  cafe: [
    ['Reorder a matcha', defaultPrompt],
    ['Browse and order a matcha', 'Order a vanilla matcha for pickup at 1:00 PM.'],
  ],
  apparel: [
    ['Add a tee and crewneck to the cart', 'Add an I ❤️ SDKs Tee and a Starburst Crewneck to your bag, then select Finish cart task.'],
    ['Order the I ❤️ SDKs Tee', 'Order an I ❤️ SDKs Tee in a size Medium.'],
    ['Order an Orbital Hoodie', 'Order an Orbital Hoodie in a size Large.'],
    ['Order a Signal Cap', 'Find the Signal Cap and place an order.'],
  ],
  custom: [],
} as const

function Dashboard({ userId, canConfigureAccess }: { userId: string; canConfigureAccess: boolean }) {
  const [params] = useSearchParams()
  const project = projects.find(key => key === params.get('project'))
  if (project) return <section className="replay page">
    <Link className="project-back" to="/home"><ArrowLeft size={17} aria-hidden="true" /> All projects</Link>
    <h1>{project === 'custom' ? 'Custom projects' : projectNames[project]}</h1>
    <div className="panel project-workspace"><ProjectTests key={`${userId}:${project}`} project={project} userId={userId} /></div>
  </section>
  return <section className="replay page studies-overview">
    <header className="page-heading"><h1>Study dashboard</h1>{canConfigureAccess && <Link className="secondary" to="/settings">Reviewer access</Link>}</header>
    <nav className="project-folders project-cards" aria-label="Project folders">
      {projects.map(key => <div className={`project-card project-card-${key}`} key={key}>
        <Link className="project-card-toggle" to={`/home?project=${key}`}>
          {key === 'custom' ? <><Plus size={23} aria-hidden="true" /> Add a project</> : projectNames[key]}
        </Link>
        {key !== 'custom' && <div className={`project-card-preview project-card-preview-${key}`} aria-hidden="true">
          <Prototype prototype={key === 'cafe' ? cafe : studio} screen="home" readonly />
        </div>}
      </div>)}
    </nav>
  </section>
}

function ProjectTests({ project, userId }: { project: Project; userId: string }) {
  const { records, status } = useQuery<{ prompt: string; script?: string }>('study', { orderBy: 'createdAt', orderDir: 'desc' })
  const { records: events, status: eventsStatus } = useQuery<Event>('replay_events', { orderBy: 'createdAt', orderDir: 'desc' })
  const { createConfirmed } = useMutations<{ prompt: string; script?: string }>('study')
  const guideKey = `taskreplay:project-guide:${userId}:${project}`
  const [guideStep, setGuideStep] = useState<number | null>(() => {
    if (project === 'custom') return null
    try { return localStorage.getItem(guideKey) ? null : 0 } catch { return 0 }
  })
  function closeGuide() {
    try { localStorage.setItem(guideKey, 'seen') } catch { /* Continue if browser storage is unavailable. */ }
    setGuideStep(null)
  }
  const [copyStatus, setCopyStatus] = useState('')
  const [creating, setCreating] = useState(project === 'custom')
  const [draft, setDraft] = useState<string>()
  const [scriptDraft, setScriptDraft] = useState<string>()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<{ session: string; step?: number }>()
  const projectTests = records.filter(record => projectForScript(record.data.script) === project)
  const published = projectTests[0]
  const prompt = published?.data.prompt ?? presets[project][0]?.[1] ?? ''
  const sessions = groupSessions(events).filter(item => projectForScript(item.events[0]?.script) === project)
  const session = sessions.find(item => item.key === selected?.session)
  const current = session?.events.find(event => event.step === selected?.step) ?? session?.events.at(-1)
  const template = project === 'apparel' ? studio : cafe
  const script = published?.data.script ?? (project === 'apparel' ? JSON.stringify(studio) : defaultScript)
  const activePrototype = readScript(script)
  const replayPrototype = readScript(session?.events[0].script)
  const { finding, total } = findFriction(sessions, prompt, script)
  const successfulPath = shortestCompletedPath(sessions, prompt, script)

  function reviewEvidence(key: string, screen: string) {
    const events = sessions.find(item => item.key === key)?.events ?? []
    const backtrack = events.findIndex(event => event.action === 'Back' && event.from === screen)
    const before = backtrack > 0 ? events[backtrack - 1] : undefined
    setSelected({ session: key, step: before?.step })
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const task = (draft ?? prompt).trim()
    if (!task) return
    setSaving(true)
    try {
      const settings = { prompt: task, script: JSON.stringify(parseScript(scriptDraft ?? (project === "custom" ? published?.data.script ?? "" : JSON.stringify(template)))) }
      if (projectForScript(settings.script) !== project) {
        setMessage('Choose a prototype for this folder. Custom tests need a custom script.')
        return
      }
      await createConfirmed(settings)
      setDraft(undefined)
      setScriptDraft(undefined)
      setMessage('Usability test published. Share the tester link to collect a run.')
      setCreating(false)
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'Enter a valid JSON script.' : 'Could not save. Check the screen IDs and destinations, then try again.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="project-tests">
    <header className="page-heading">
      <h2>Usability tests</h2>
      <div>
      {project !== 'custom' && <button className="secondary" type="button" onClick={() => setGuideStep(0)}>Project guide</button>}
      <button className="primary" type="button" onClick={() => { setCreating(!creating); setMessage('') }}>{creating ? 'Close setup' : '+ New usability test'}</button>
    </div>
    </header>
    {guideStep !== null && <ProjectGuide project={project} step={guideStep} onStep={setGuideStep}
      onSkip={closeGuide} onSetup={() => { closeGuide(); setDraft(presets[project][0]?.[1]); setCreating(true) }} />}
    {projectTests.length > 0 && <details className="study-folder" open>
      <summary>Published tests</summary>
      <ul className="published-test-list">{projectTests.map(record => {
        const path = `/test?project=${project}&test=${encodeURIComponent(record.recordId)}`
        return <li key={record.recordId}>
          <span>{record.data.prompt}</span>
          <div className="published-test-actions">
            <Link to={path}>Open tester link →</Link>
            <button className="secondary" type="button" onClick={async () => {
              try {
                await navigator.clipboard.writeText(new URL(path, window.location.origin).href)
                setCopyStatus('Tester link copied.')
              } catch {
                setCopyStatus('Could not copy. Open the tester link and copy it from the address bar.')
              }
            }}>Copy tester link</button>
          </div>
        </li>
      })}</ul>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </details>}
    {creating && <form className="panel task" onSubmit={save}>
      {presets[project].length > 0 && <><label htmlFor="task-preset">Task presets</label>
        <select id="task-preset" value="" onChange={event => { if (event.target.value) setDraft(event.target.value) }}>
          <option value="" disabled>Choose a task</option>
          {presets[project].map(([label, task]) => <option value={task} key={label}>{label}</option>)}
        </select></>}
      <label htmlFor="prompt">Task prompt</label>
      <div className="form-row"><input id="prompt" maxLength={240} required value={draft ?? prompt} onChange={e => setDraft(e.target.value)} />
        <button className="secondary" disabled={saving || !(draft ?? prompt).trim() || status !== 'ready'}>Publish test</button></div>
      {project === 'custom' && <><label htmlFor="script">Prototype JSON</label>
        <textarea id="script" rows={12} maxLength={32000} value={scriptDraft ?? (published ? JSON.stringify(activePrototype, null, 2) : '')} onChange={e => setScriptDraft(e.target.value)} required /></>}
    </form>}
    {message && <p role="status">{message}</p>}
    <div className="dashboard project-workspace-grid">
      <section className="panel">
        <h2>Test runs</h2>
        {eventsStatus === 'loading' && <p>Loading test runs…</p>}
        {eventsStatus === 'error' && <p role="alert">Could not load test runs.</p>}
        {eventsStatus === 'ready' && sessions.length === 0 && <p>No test runs yet.</p>}
        <ul className="timeline">{sessions.map((item, index) =>
          <li key={item.key}><button aria-pressed={session?.key === item.key} onClick={() => setSelected({ session: item.key })}>Test run {sessions.length - index}<small>{outcome(item.events)}</small></button></li>)}</ul>
      </section>
      {session && <section className="panel">
        <h2>Activity timeline</h2>
        {session && <SessionPresence key={session.key} id={session.events[0].sessionId} />}
        {session && <p>{session.events[0].prompt}</p>}
        {session && <button className="secondary" disabled={selected?.step === undefined} onClick={() => setSelected({ session: session.key })}>Follow latest</button>}
        <ol className="timeline">{session?.events.map(event =>
          <li key={event.step}><button aria-pressed={current?.step === event.step} onClick={() => setSelected({ session: session.key, step: event.step })}>{event.action}<small>{replayPrototype.screens[event.screen]?.title}</small></button></li>)}</ol>
      </section>}
      <section className="panel project-preview">
        <h2>Screen preview</h2>
        {current ? <Prototype screen={current.screen} prototype={replayPrototype} readonly
          actions={session?.events.filter(event => event.step <= current.step).map(event => event.action)} /> : <p>Select a test run to see what the tester saw.</p>}
      </section>
    </div>
    <section className="panel results">
      <h2>Study results</h2>
      <p>{total} finished {total === 1 ? 'session' : 'sessions'} for the current task prompt.</p>
      {successfulPath.length > 0 && <p><strong>Shortest observed route without backtracking</strong><br />{successfulPath.map(event => event.action).join(" → ")}</p>}
      {finding ? <>
        <strong>{finding.sessions.length} of {total} finished sessions backtracked from {activePrototype.screens[finding.screen]?.title}.</strong>
        <p><strong>Recommended next step. </strong>{isCafePrototype(activePrototype) && finding.screen === 'orders' ? 'Try adding a Reorder button to Past Orders and run another round.' : 'Review what testers saw here before deciding what to change.'}</p>
        {finding.sessions.map(key => <button className="secondary" key={key} onClick={() => reviewEvidence(key, finding.screen)}>Review test run {sessions.length - sessions.findIndex(item => item.key === key)}</button>)}
      </> : <p>A finding appears when two finished sessions backtrack from the same screen.</p>}
    </section>
  </section>
}

function SessionPresence({ id }: { id: string }) {
  const { peers, connected } = usePresenceRoom(`replay:${id}`)
  return <p className="presence">{connected && peers.some(peer => peer.state.testing === true) ? '● Tester online' : '○ Tester offline'}</p>
}

function ProjectGuide({ project, step, onStep, onSkip, onSetup }: {
  project: Project
  step: number
  onStep: (step: number) => void
  onSkip: () => void
  onSetup: () => void
}) {
  const example = project === 'cafe' ? 'Reorder a matcha' : 'Add a tee and crewneck to the cart'
  const steps = [
    { title: 'Want a quick walkthrough?', description: `See how to set up and review a usability test for ${projectNames[project]}.` },
    { title: 'Choose and publish a task', description: `Start with “${example}” or write your own. Publish it to generate a tester link.` },
    { title: 'Share the tester link', description: 'Open the link with the tester account in another browser profile. The manager can watch the actions arrive as the tester completes the task.' },
    { title: 'Replay and review', description: 'Select a test run, then click a timeline step to replay it. Review the study findings after more testers finish.' },
  ]
  const current = steps[step]
  const last = step === steps.length - 1
  return <Modal open onClose={onSkip}>
    <Modal.Header>
      <p className="text-sm font-semibold text-primary">{projectNames[project]} guide{step > 0 && ` · ${step} of ${steps.length - 1}`}</p>
      <Modal.Title>{current.title}</Modal.Title>
      <Modal.Description>{current.description}</Modal.Description>
    </Modal.Header>
    <Modal.Footer>
      <Button type="button" variant="secondary" onClick={onSkip}>Skip for now</Button>
      {step > 0 && <Button type="button" variant="secondary" onClick={() => onStep(step - 1)}>Back</Button>}
      <Button type="button" onClick={last ? onSetup : () => onStep(step + 1)}>
        {last ? 'Set up this test' : step === 0 ? 'Show me around' : 'Next'}
      </Button>
    </Modal.Footer>
  </Modal>
}
