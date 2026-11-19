import assert from 'node:assert/strict'
import test from 'node:test'
import { findFriction, groupSessions, shortestCompletedPath, type Event } from '../src/lib/replay.ts'
import { cafe, studio, parseScript } from '../src/lib/prototypes.ts'

const prompt = 'Reorder your matcha'
const script = JSON.stringify(cafe)

function run(owner: string, actions: [string, string, string][]) {
  return [['Started session', 'home', 'home'], ...actions].map(([action, screen, from], step) => ({
    createdBy: owner,
    data: { action, screen, from, step, prompt, sessionId: 'run', script: step === 0 ? script : undefined } satisfies Event,
  }))
}

test('counts repeated backtracking once per finished session, keeping owners separate', () => {
  const back: [string, string, string] = ['Back', 'home', 'orders']
  const ended: [string, string, string] = ['Ended session', 'home', 'home']
  const sessions = groupSessions([...run('a', [back, back, ended]), ...run('b', [back, ended]), ...run('c', [back])])
  assert.deepEqual(findFriction(sessions, prompt, script), {
    total: 2,
    finding: { screen: 'orders', sessions: ['a:run', 'b:run'] },
  })
  assert.equal(findFriction(sessions, prompt, JSON.stringify(studio)).total, 0)
})

test('reports a clean observed completion path', () => {
  const path = shortestCompletedPath(groupSessions(run('a', [['Confirm Pickup', 'done', 'review']])), prompt, script)
  assert.deepEqual(path.map(event => event.action), ['Confirm Pickup'])
})

test('both built-in scripts load and broken destinations are rejected', () => {
  assert.equal(parseScript(script).name, cafe.name)
  assert.equal(parseScript(JSON.stringify(studio)).name, studio.name)
  assert.throws(() => parseScript(script.replace('["Past Orders","orders"]', '["Past Orders","missing"]')))
})
