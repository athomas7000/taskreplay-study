/**
 * Top nav — minimal placeholder bar wired to the app's mechanisms:
 * nav.ts-driven links (with role/dev filtering), sign-in via <AuthOverlay>,
 * and sign-out. Restyle or rebuild it freely; keep the data-testid hooks
 * (`app-navigation`, `nav-sign-in-button`, `nav-user-name`, `nav-user-email`)
 * — the shipped tests rely on them. `nav-user-email` is the one that carries
 * an identity the test can check exactly: a display name is optional, the
 * email is the credential the session was opened with.
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthOverlay, useAuthProfileReady, useQuery, signOut } from 'deepspace'
import { ChevronDown, CirclePlay, LogOut, UserRound } from 'lucide-react'
import { APP_NAME } from '../constants'
import type { Role } from '../constants'
import { nav } from '../nav'
import { canManageStudy } from '../lib/study-roles'
import { cn } from '../lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui'

export default function Navigation() {
  const { isLoaded, isSignedIn, user, userLoading } = useAuthProfileReady({ requireUser: true })
  const location = useLocation()
  const navigate = useNavigate()
  const { records: profiles } = useQuery<{ displayName?: string }>('users', { where: { recordId: user?.id ?? '' } })
  const displayName = profiles.find(profile => profile.recordId === user?.id)?.data.displayName || user?.name || user?.email
  const [searchParams, setSearchParams] = useSearchParams()
  const [authMode, setAuthMode] = useState<'login' | 'signup'>()
  const requestedAuth = searchParams.get('auth')
  const activeAuth = authMode ?? (requestedAuth === 'login' || requestedAuth === 'signup' ? requestedAuth : undefined)

  function closeAuth() {
    setAuthMode(undefined)
    if (searchParams.has('auth')) {
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
    }
  }

  const profileReady = !isSignedIn || (!userLoading && !!user)
  const userRole = (user?.role ?? 'anonymous') as Role | 'anonymous'

  const visibleNav = nav.filter((item) => {
    if (item.devOnly && !import.meta.env.DEV) return false
    if (item.path === '/home' && isSignedIn) return profileReady && canManageStudy(user?.role)
    if (!item.roles) return true
    if (!profileReady) return false
    if (userRole === 'admin') return true
    return item.roles.includes(userRole as Role)
  })

  const navLink = (item: (typeof nav)[number]) => {
    const active = location.pathname.startsWith(item.path)
    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'px-3 py-1.5 text-sm',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {item.path === '/home' && isSignedIn ? 'Studies' : item.label}
      </Link>
    )
  }

  return (
    <>
      <nav data-testid="app-navigation" className="app-site-nav">
        <div className="app-site-nav-row">
          <Link to="/" className="landing-brand"><CirclePlay size={24} aria-hidden="true" />
            {APP_NAME}
          </Link>


          <div className="flex-1" />

          {!isLoaded ? null : isSignedIn && !profileReady ? (
            /* Signed in, profile still loading — skeleton pill, never the
               Sign in button (that would offer sign-in to a signed-in user). */
            <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2.5">
              <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
              <div className="hidden h-4 w-20 animate-pulse rounded-md bg-muted sm:block" />
            </div>
          ) : isSignedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    aria-label="Account menu"
                    className="group flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-2.5 text-sm transition-colors hover:bg-card"
                  >
                    <Avatar className="h-6 w-6 ring-1 ring-inset ring-border">
                      <AvatarImage src={user.imageUrl ?? undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-[11px]">
                        {(displayName?.[0] ?? '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      data-testid="nav-user-name"
                      className="hidden max-w-[140px] truncate text-foreground sm:inline"
                    >
                      {displayName}
                    </span>
                    <ChevronDown
                      className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-150 group-data-[popup-open]:rotate-180"
                      aria-hidden
                    />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="truncate font-medium text-foreground">
                    {displayName || 'Signed in'}
                  </div>
                  <div
                    data-testid="nav-user-email"
                    className="truncate text-xs font-normal text-muted-foreground"
                  >
                    {user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <UserRound aria-hidden />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="site-auth-actions">
              <button type="button" data-testid="nav-sign-in-button" onClick={() => setAuthMode('login')}>Log in</button>
              <button type="button" className="site-sign-up" onClick={() => setAuthMode('signup')}>Sign up</button>
            </div>
          )}

        </div>
        <div className="site-role-links">{visibleNav.map(navLink)}</div>
      </nav>

      {activeAuth && !isSignedIn && <AuthOverlay onClose={closeAuth}
        title={activeAuth === 'signup' ? 'Create your TaskReplay account' : 'Log in to TaskReplay'}
        description={activeAuth === 'signup' ? 'Use Google or GitHub to get started.' : 'Continue with Google, GitHub, or your demo account.'} />}
    </>
  )
}
