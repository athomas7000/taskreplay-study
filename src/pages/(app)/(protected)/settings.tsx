/**
 * Example gated page. Reached at /settings — no auth logic lives here
 * because (protected)/_layout.tsx already wraps the subtree in <AuthGate>.
 */

import { signOut, useUser, useUsers } from 'deepspace'
import { Button } from '@/components/ui'
import { STUDY_MANAGER_ROLE } from '../../../lib/study-roles'

export default function SettingsPage() {
  const { user } = useUser()

  return (
    // No background on page wrappers — pages render into whatever the app's
    // (app)/_layout provides (a plain background, or a raised panel), so they
    // stay transparent and inherit it.
    <div className="min-h-full text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="mb-12 text-4xl font-bold tracking-tight">Settings</h1>

        <section className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Your account</h2>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{user?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{user?.email ?? '—'}</dd>
            </div>
          </dl>

          <Button variant="secondary" className="mt-6" onClick={() => signOut()}>
            Sign out
          </Button>
        </section>
        {user?.role === 'admin' && <ReviewerAccess />}
      </div>
    </div>
  )
}

function ReviewerAccess() {
  const { users, usersLoaded, setRole } = useUsers()
  const reviewers = users.filter(account => account.email?.toLowerCase().endsWith('@deepspace.test') && account.role !== 'admin')

  return <section className="mt-6 rounded-lg border border-border bg-card p-6">
    <h2 className="mb-2 text-lg font-semibold">Reviewer access</h2>
    <p className="text-sm text-muted-foreground">Create demo accounts with the DeepSpace CLI, then sign in to this deployment once with each account. Give one account Study Manager access and keep the other as a Tester.</p>
    {!usersLoaded ? <p className="mt-4 text-sm">Loading demo accounts…</p> : reviewers.length === 0
      ? <p className="mt-4 text-sm">No demo accounts have signed in to this deployment yet.</p>
      : <ul className="mt-4 divide-y divide-border">{reviewers.map(account => {
        const manager = account.role === STUDY_MANAGER_ROLE
        return <li key={account.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="text-sm">
            <div className="break-all">{account.email}</div>
            <div className="text-muted-foreground">{manager ? 'Study Manager' : 'Tester'}</div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setRole(account.id, manager ? 'viewer' : STUDY_MANAGER_ROLE)}>
            {manager ? 'Make tester' : 'Make study manager'}
          </Button>
        </li>
      })}</ul>}
  </section>
}
