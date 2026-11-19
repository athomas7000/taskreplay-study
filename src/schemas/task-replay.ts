import type { CollectionSchema } from 'deepspace/schema'

const participant = { read: 'own', create: true, update: false, delete: false } as const
const readOnly = { read: true, create: false, update: false, delete: false } as const

export const replayEventsSchema: CollectionSchema = {
  name: 'replay_events',
  columns: [
    { name: 'sessionId', storage: 'text', interpretation: 'plain' },
    { name: 'step', storage: 'number', interpretation: 'plain' },
    { name: 'action', storage: 'text', interpretation: 'plain' },
    { name: 'screen', storage: 'text', interpretation: 'plain' },
    { name: 'from', storage: 'text', interpretation: 'plain' },
    { name: 'script', storage: 'text', interpretation: 'plain' },
    { name: 'prompt', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    member: participant,
    viewer: participant,
    admin: { ...readOnly, create: true },
  },
}

export const studySchema: CollectionSchema = {
  name: 'study',
  columns: [
    { name: 'prompt', storage: 'text', interpretation: 'plain' },
    { name: 'script', storage: 'text', interpretation: 'plain' },
  ],
  permissions: {
    member: readOnly,
    viewer: readOnly,
    admin: { ...readOnly, create: true, update: true },
  },
}
