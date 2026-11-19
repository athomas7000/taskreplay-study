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

type Study = { title?: string; prompt: string; script?: string }
type StudyTester = { studyId: string; email: string }

const starterScript = JSON.stringify({
  name: 'Pickup booking',
  screens: {
    home: { title: 'Book a pickup', buttons: [['Choose a time', 'pickup']] },
    pickup: { title: 'Choose a pickup time', buttons: [['Confirm 12:30 PM', 'done'], ['Back', 'home']] },
    done: { title: 'Pickup confirmed', buttons: [] },
  },
}, null, 2)

function StudyTesters({ studyId }: { studyId: string }) {
  const { records, status } = useQuery<StudyTester>('study_testers')
  const { createConfirmed } = useMutations<StudyTester>('study_testers')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const testers = records.filter(record => record.data.studyId === studyId)

  async function addTester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const address = email.trim().toLowerCase()
    if (!address || saving || status !== 'ready') return
    if (testers.some(record => record.data.email === address)) {
      setMessage('That email is already on your list.')
      return
    }
    setSaving(true)
    try {
      await createConfirmed({ studyId, email: address })
      setEmail('')
      setMessage('Tester added.')
    } catch {
      setMessage('Could not add this tester. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="study-testers" aria-label="Tester list">
    <strong>Tester list</strong>
    <p>Keep track of who you plan to invite. Send them the tester link when you’re ready.</p>
    {status === 'loading' && <p>Loading testers…</p>}
    {status === 'error' && <p role="alert">Could not load testers.</p>}
    {status === 'ready' && (testers.length
      ? <ul>{testers.map(record => <li key={record.recordId}>{record.data.email}</li>)}</ul>
      : <p>No testers added yet.</p>)}
    <form className="form-row" onSubmit={addTester}>
      <input aria-label="Tester email" type="email" autoComplete="off" placeholder="tester@example.com" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} />
      <button className="secondary" disabled={status !== 'ready' || saving || !email.trim()}>{saving ? 'Adding…' : 'Add tester'}</button>
    </form>
    {message && <p role="status">{message}</p>}
  </section>
}

function ProjectTests({ project, userId }: { project: Project; userId: string }) {
  const { records, status } = useQuery<Study>('study', { orderBy: 'createdAt', orderDir: 'desc' })
  const { records: events, status: eventsStatus } = useQuery<Event>('replay_events', { orderBy: 'createdAt', orderDir: 'desc' })
  const { createConfirmed } = useMutations<Study>('study')
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
  const [title, setTitle] = useState('')
  const [draft, setDraft] = useState('')
  const [scriptDraft, setScriptDraft] = useState('')
  const [testerList, setTesterList] = useState<string>()
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
    const task = draft.trim()
    if (!task || !title.trim() || saving) return
    setSaving(true)
    try {
      const settings = { title: title.trim(), prompt: task, script: JSON.stringify(project === "custom" ? parseScript(scriptDraft) : template) }
      if (projectForScript(settings.script) !== project) {
        setMessage('Choose a prototype for this folder. Custom tests need a custom script.')
        return
      }
      const studyId = await createConfirmed(settings)
      setTitle('')
      setDraft('')
      setScriptDraft('')
      setTesterList(studyId)
      setMessage('Study published. Add testers below or copy the tester link to share it.')
      setCreating(false)
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'Check the JSON syntax and try again.' : 'Could not publish. Check the prototype’s screen IDs and button destinations, then try again.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="project-tests">
    <header className="page-heading">
      <h2>Studies</h2>
      <div className="project-heading-actions">
      {(project !== 'custom' || published) && <Link className="secondary" to={`/test?project=${project}&preview=1${published ? `&test=${encodeURIComponent(published.recordId)}` : ''}`}>Try as a tester</Link>}
      {project !== 'custom' && <button className="secondary" type="button" onClick={() => setGuideStep(0)}>Project guide</button>}
      <button className="primary" type="button" onClick={() => { setCreating(!creating); setMessage('') }}>{creating ? 'Close study setup' : '+ New study'}</button>
    </div>
    </header>
    {guideStep !== null && <ProjectGuide project={project} step={guideStep} onStep={setGuideStep}
      onSkip={closeGuide} onSetup={() => { closeGuide(); setTitle(presets[project][0]?.[0] ?? ''); setDraft(presets[project][0]?.[1] ?? ''); setCreating(true) }} />}
    {creating && <form className="panel study-setup" onSubmit={save}>
      <h3>Create a study</h3>
      {presets[project].length > 0 && <div>
        <label htmlFor="task-preset">Start with an example <small>(optional)</small></label>
        <select id="task-preset" value="" onChange={event => {
          const preset = presets[project].find(([, task]) => task === event.target.value)
          if (preset) { setTitle(preset[0]); setDraft(preset[1]) }
        }}>
          <option value="" disabled>Choose a task</option>
          {presets[project].map(([label, task]) => <option value={task} key={label}>{label}</option>)}
        </select>
      </div>}
      <div>
        <label htmlFor="study-title">Study name</label>
        <input id="study-title" placeholder="e.g. Pickup booking test" maxLength={80} required value={title} onChange={event => setTitle(event.target.value)} />
      </div>
      <div>
        <label htmlFor="prompt">What should testers do?</label>
        <p id="task-hint">Describe the goal in language your testers use. Leave out the steps so you can see what they try.</p>
        <textarea id="prompt" aria-describedby="task-hint" rows={2} placeholder="e.g. Book a pickup for 12:30 PM." maxLength={240} required value={draft} onChange={event => setDraft(event.target.value)} />
      </div>
      <div>
        <label htmlFor={project === 'custom' ? 'script' : undefined}>Prototype</label>
        {project === 'custom' ? <>
          <p id="prototype-hint">Paste the JSON that defines your screens and where each button leads. The prototype starts at <code>home</code> and finishes at <code>done</code>.</p>
          {!scriptDraft.trim() && <button className="secondary" type="button" onClick={() => {
            setScriptDraft(starterScript)
            if (!title.trim()) setTitle('Pickup booking test')
            if (!draft.trim()) setDraft('Book a pickup for 12:30 PM.')
          }}>Load a starter example</button>}
          <textarea id="script" aria-describedby="prototype-hint" rows={6} maxLength={32000} value={scriptDraft} onChange={event => setScriptDraft(event.target.value)} required />
        </> : <p>{template.name}</p>}
      </div>
      <footer className="form-row">
        <p>Publish to get a shareable link and start adding testers.</p>
        <button className="primary" disabled={saving || !title.trim() || !draft.trim() || (project === 'custom' && !scriptDraft.trim()) || status !== 'ready'}>{saving ? 'Publishing…' : 'Publish study'}</button>
      </footer>
    </form>}
    {message && <p role="status">{message}</p>}
    {projectTests.length > 0 && <details className="study-folder" open>
      <summary>Published studies</summary>
      <ul className="published-test-list">{projectTests.map(record => {
        const path = `/test?project=${project}&test=${encodeURIComponent(record.recordId)}`
        return <li key={record.recordId}>
          <div>{record.data.title && <strong>{record.data.title}</strong>}<p>{record.data.prompt}</p></div>
          <div className="published-test-actions">
            <Link to={`${path}&preview=1`}>Try as a tester</Link>
            <Link to={path}>Open tester link →</Link>
            <button className="secondary" type="button" onClick={async () => {
              try {
                await navigator.clipboard.writeText(new URL(path, window.location.origin).href)
                setCopyStatus('Tester link copied.')
              } catch {
                setCopyStatus('Could not copy. Open the tester link and copy it from the address bar.')
              }
            }}>Copy tester link</button>
            <button className="secondary" aria-expanded={testerList === record.recordId} type="button" onClick={() => setTesterList(testerList === record.recordId ? undefined : record.recordId)}>Manage testers</button>
          </div>
          {testerList === record.recordId && <StudyTesters studyId={record.recordId} />}
        </li>
      })}</ul>
      {copyStatus && <p role="status">{copyStatus}</p>}
    </details>}
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
    { title: 'Create and publish a study', description: `Name your study, then start with “${example}” or write your own task. Choose Publish study to create a tester link.` },
    { title: 'Try the task yourself', description: 'Choose Try as a tester to see the task and use the prototype. Preview actions stay in your tab and don’t appear in study results.' },
    { title: 'Share the tester link', description: 'Add email addresses to the tester list, then copy and send the tester link. You can follow each tester’s actions as they complete the task.' },
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
        {last ? 'Set up a study' : step === 0 ? 'Show me around' : 'Next'}
      </Button>
    </Modal.Footer>
  </Modal>
}
