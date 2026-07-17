import { useState, type ComponentType, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Activity,
  BedDouble,
  Bot,
  ClipboardEdit,
  LayoutDashboard,
  Menu,
  Navigation,
  PhoneCall,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { DemoRoleSwitcher } from './DemoRoleSwitcher'
import { PageSubnav } from './PageSubnav'
import { CareLockRedirect } from '../CareLockRedirect'
import { useClinic } from '../../store/clinicStore'

type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

function useRoleMenu(): NavItem[] {
  const { isGeneralView, isAdminView, isAiView, isStaffView, viewingStaff, state } =
    useClinic()

  if (isAiView) {
    return [
      { to: '/rooms', label: 'Demo Overview', icon: Bot, end: true },
      { to: '/#staff', label: 'Staff table', icon: Users },
    ]
  }

  if (isGeneralView) {
    return [
      { to: '/', label: 'Ops', icon: LayoutDashboard, end: true },
      { to: '/rooms', label: 'Rooms', icon: BedDouble },
    ]
  }

  if (isAdminView) {
    return [
      { to: '/', label: 'Ops', icon: LayoutDashboard, end: true },
      { to: '/admin/intake', label: 'Intake', icon: UserPlus },
      { to: '/rooms', label: 'Rooms', icon: BedDouble },
    ]
  }

  if (isStaffView) {
    const lock =
      viewingStaff && viewingStaff.role !== 'admin'
        ? state.patients.find(
            (p) => p.roomId === viewingStaff.currentRoomId && !p.visitComplete,
          )
        : null
    const roomId = viewingStaff?.currentRoomId
    // While caring: only this patient — no other rooms menu
    if (lock && roomId) {
      const room = state.rooms.find((r) => r.id === roomId)
      return [
        {
          to: `/room/${roomId}`,
          label: room ? `${room.name}` : 'Current patient',
          icon: Users,
          end: true,
        },
        {
          to: `/room/${roomId}/care`,
          label: 'Update care',
          icon: ClipboardEdit,
        },
        {
          to: `/room/${roomId}/call`,
          label: 'Call staff',
          icon: PhoneCall,
        },
      ]
    }
    return [
      { to: '/my-dashboard', label: 'My rooms', icon: Users, end: true },
      { to: '/move', label: 'Where to go', icon: Navigation },
      { to: '/rooms', label: 'All rooms', icon: BedDouble },
    ]
  }

  return [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }]
}

export function AppShell({ children }: { children: ReactNode }) {
  const links = useRoleMenu()
  const { isGeneralView, isAdminView, isAiView, isStaffView, viewingStaff } = useClinic()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuHint = isAiView
    ? 'Demo Agent'
    : isGeneralView
      ? 'General'
      : isAdminView
        ? 'Admin'
        : isStaffView
          ? (viewingStaff?.name ?? 'Staff')
          : 'Menu'

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <CareLockRedirect />
      {/* Desktop left main menu */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-4 py-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold leading-tight">ClinicCare</p>
              <p className="text-[11px] text-slate-500">{menuHint}</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Main menu">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold">ClinicCare</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5 p-2" aria-label="Main menu">
              {links.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                className="rounded-md border border-slate-200 p-1.5 text-slate-600 md:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open main menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:hidden">
                  {menuHint} · page menu
                </p>
                <PageSubnav />
              </div>
            </div>
            <DemoRoleSwitcher />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5">{children}</main>
      </div>
    </div>
  )
}
