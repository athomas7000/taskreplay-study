import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuthProfileReady, useMutations, usePresenceRoom, useQuery } from 'deepspace'
import { Prototype } from '../../components/Prototype'
import { defaultPrompt, findFriction, groupSessions, outcome, shortestCompletedPath, type Event } from '../../lib/replay'
import { cafe, game, defaultScript, parseScript, readScript } from '../../lib/prototypes'
import '../../replay.css'

export default function StudyPage() {
  const { isSignedIn, user } = useAuthProfileReady({ requireUser: true })
  if (!isSignedIn) return <section className="replay page"><h1>Study dashboard</h1><p>Sign in using the navigation bar to manage the study.</p></section>
  if (!user) return <section className="replay page"><p>Loading your profile…</p></section>
  if (user.role !== 'admin') return <section className="replay page"><h1>Study dashboard</h1><p>The app administrator manages this study.</p><Link className="primary" to="/test">Go to tester view</Link></section>
  return <Dashboard />
}

function Dashboard() {
  const { records, status } = useQuery<{ prompt: string; script?: string }>('study', { orderBy: 'createdAt', orderDir: 'desc' })
  const { records: events, status: eventsStatus } = useQuery<Event>('replay_events', { orderBy: 'createdAt', orderDir: 'desc' })
  const { createConfirmed, putConfirmed } = useMutations<{ prompt: string; script?: string }>('study')
  const [draft, setDraft] = useState<string>()
  const [scriptDraft, setScriptDraft] = useState<string>()
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<{ session: string; step?: number }>()
  const prompt = records[0]?.data.prompt ?? defaultPrompt
  const sessions = groupSessions(events)
  const session = sessions.find(item => item.key === selected?.session) ?? sessions[0]
  const current = session?.events.find(event => event.step === selected?.step) ?? session?.events.at(-1)
  const script = records[0]?.data.script ?? defaultScript
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
      const settings = { prompt: task, script: JSON.stringify(parseScript(scriptDraft ?? script)) }
      if (records[0]) await putConfirmed(records[0].recordId, settings)
      else await createConfirmed(settings)
      setDraft(undefined)
      setScriptDraft(undefined)
      setMessage('Task saved.')
    } catch (error) {
      setMessage(error instanceof SyntaxError ? 'Enter a valid JSON script.' : 'Could not save. Check the screen IDs and destinations, then try again.')
    } finally {
      setSaving(false)
    }
  }

  return <section className="replay page">
    <div className="eyebrow">MANAGER VIEW</div>
    <header className="page-heading"><h1>Study dashboard</h1><Link className="primary" to="/test">Open tester link →</Link></header>
    <form className="panel task" onSubmit={save}>
      <label htmlFor="prompt">Task prompt</label>
      <div className="form-row"><input id="prompt" maxLength={240} required value={draft ?? prompt} onChange={e => setDraft(e.target.value)} />
        <button className="secondary" disabled={saving || !(draft ?? prompt).trim() || (draft === undefined && scriptDraft === undefined) || status === 'loading' || status === 'error'}>Save task</button></div>
      <details>
        <summary>Prototype options and custom script</summary>
        <p>Choose a template or paste a JSON script. Every prototype starts at <code>home</code> and ends at <code>done</code>. Buttons list a label and a destination.</p>
        <button type="button" className="secondary" onClick={() => { setScriptDraft(JSON.stringify(cafe, null, 2)); setDraft(defaultPrompt) }}>Matcha café</button>
        <button type="button" className="secondary" onClick={() => { setScriptDraft(JSON.stringify(game, null, 2)); setDraft('Find the power cell and restore the beacon.') }}>Moonbase game</button>
        <label htmlFor="script">Prototype JSON</label>
        <textarea id="script" rows={12} maxLength={32000} value={scriptDraft ?? JSON.stringify(activePrototype, null, 2)} onChange={e => setScriptDraft(e.target.value)} />
      </details>
      {message && <p role="status">{message}</p>}
    </form>
    <div className="dashboard">
      <section className="panel">
        <h2>Sessions</h2>
        {eventsStatus === 'loading' && <p>Loading sessions…</p>}
        {eventsStatus === 'error' && <p role="alert">Could not load the session timeline.</p>}
        {sessions.length === 0 && <p>Share the tester link to start collecting sessions.</p>}
        <ul className="timeline">{sessions.map((item, index) =>
          <li key={item.key}><button aria-pressed={session?.key === item.key} onClick={() => setSelected({ session: item.key })}>Session {sessions.length - index}<small>{outcome(item.events)}</small></button></li>)}</ul>
      </section>
      <section className="panel">
        <h2>Activity timeline</h2>
        {session && <SessionPresence key={session.key} id={session.events[0].sessionId} />}
        {session && <p>{session.events[0].prompt}</p>}
        {session && <button className="secondary" disabled={selected?.step === undefined} onClick={() => setSelected({ session: session.key })}>Follow latest</button>}
        <ol className="timeline">{session?.events.map(event =>
          <li key={event.step}><button aria-pressed={current?.step === event.step} onClick={() => setSelected({ session: session.key, step: event.step })}>{event.action}<small>{replayPrototype.screens[event.screen]?.title}</small></button></li>)}</ol>
      </section>
      <section className="panel">
        <h2>Screen preview</h2>
        {current ? <Prototype screen={current.screen} prototype={replayPrototype} /> : <p>Select a session to see what the tester saw.</p>}
      </section>
    </div>
    <section className="panel results">
      <h2>Study results</h2>
      <p>{total} finished {total === 1 ? 'session' : 'sessions'} for the current task prompt.</p>
      {successfulPath.length > 0 && <p><strong>Shortest observed route without backtracking</strong><br />{successfulPath.map(event => event.action).join(" → ")}</p>}
      {finding ? <>
        <strong>{finding.sessions.length} of {total} finished sessions backtracked from {activePrototype.screens[finding.screen]?.title}.</strong>
        <p>{activePrototype.name === cafe.name && finding.screen === 'orders' ? 'Try adding a Reorder button to Past Orders and run another round.' : 'Review what testers saw here before deciding what to change.'}</p>
        {finding.sessions.map(key => <button className="secondary" key={key} onClick={() => reviewEvidence(key, finding.screen)}>Review session {sessions.length - sessions.findIndex(item => item.key === key)}</button>)}
      </> : <p>A finding appears when two finished sessions backtrack from the same screen.</p>}
    </section>
  </section>
}

function SessionPresence({ id }: { id: string }) {
  const { peers, connected } = usePresenceRoom(`replay:${id}`)
  return <p className="presence">{connected && peers.some(peer => peer.state.testing === true) ? '● Tester online' : '○ Tester offline'}</p>
}
