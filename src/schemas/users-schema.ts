import { USERS_COLUMNS, type CollectionSchema } from 'deepspace/schema'
import { STUDY_MANAGER_ROLE } from '../lib/study-roles'

export const usersSchema: CollectionSchema = {
  name: 'users',
  columns: [...USERS_COLUMNS, { name: 'displayName', storage: 'text', interpretation: 'plain', maxLength: 60 }],
  permissions: {
    viewer: { read: 'own', create: false, update: 'own', delete: false },
    [STUDY_MANAGER_ROLE]: { read: 'own', create: false, update: 'own', delete: false },
    member: { read: 'own', create: false, update: 'own', delete: false },
    admin: { read: true, create: false, update: true, delete: true },
  },
}
