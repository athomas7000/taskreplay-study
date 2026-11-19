export const defaultPrompt = 'Reorder your usual matcha for pickup at 12:30 PM.'

export type Event = {
  sessionId: string
  step: number
  action: string
  screen: string
  from: string
  prompt: string
  script?: string
}

export type Session = { key: string; events: Event[] }

export function groupSessions(records: readonly { createdBy?: string; data: Event }[]): Session[] {
  const groups = new Map<string, Event[]>()
  for (const { createdBy, data } of records) {
    const key = `${createdBy}:${data.sessionId}`
    const events = groups.get(key) ?? []
    events.push(data)
    groups.set(key, events)
  }
  return Array.from(groups, ([key, events]) => ({
    key,
    events: events.sort((a, b) => a.step - b.step),
  }))
}

export function outcome(events: Event[]) {
  if (events.some(event => event.screen === 'done')) return 'Completed'
  if (events.some(event => event.action === 'Ended session')) return 'Ended'
  return 'In progress'
}

export function findFriction(sessions: Session[], prompt: string, script?: string) {
  const finished = sessions.filter(({ events }) => events[0]?.prompt === prompt && events[0]?.script === script && outcome(events) !== 'In progress')
  const counts = new Map<string, string[]>()
  for (const session of finished) {
    const detours = new Set(session.events.filter(event => event.action === 'Back').map(event => event.from))
    for (const screen of detours) {
      counts.set(screen, [...(counts.get(screen) ?? []), session.key])
    }
  }
  const strongest = [...counts].sort(([a, first], [b, second]) => second.length - first.length || a.localeCompare(b))[0]
  if (!strongest || strongest[1].length < 2) return { total: finished.length, finding: null }
  return { total: finished.length, finding: { screen: strongest[0], sessions: strongest[1] } }
}

export function shortestCompletedPath(sessions: Session[], prompt: string, script: string) {
  const completed = sessions.filter(({ events }) => events[0]?.prompt === prompt
    && events[0]?.script === script && outcome(events) === 'Completed')
  const clean = completed.filter(({ events }) => !events.some(event => event.action === 'Back'))
  return clean.sort((a, b) => a.events.length - b.events.length)[0]?.events.slice(1) ?? []
}
