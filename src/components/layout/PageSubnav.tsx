import { NavLink, useLocation } from 'react-router-dom'
import { useClinic } from '../../store/clinicStore'
import { getCareLock } from '../../utils/careLock'

type SubNavItem = {
  to: string
  label: string
  end?: boolean
}

function usePageSubnav(): SubNavItem[] {
  const location = useLocation()
  const { isAdminView, isAiView, isStaffView, isGeneralView, viewingStaff, state } =
    useClinic()

  const path = location.pathname
  const roomMatch = path.match(/^\/room\/([^/]+)(?:\/(care|call|agent))?$/)
  const staffMatch = path.match(/^\/staff\/([^/]+)/)
  const roomId = roomMatch?.[1]
  const staffId = staffMatch?.[1]

  const careLock =
    isStaffView && viewingStaff ? getCareLock(viewingStaff, state.patients) : null

  if (careLock) {
    const room = state.rooms.find((r) => r.id === careLock.roomId)
    const items: SubNavItem[] = [
      {
        to: `/room/${careLock.roomId}`,
        label: `${room?.name ?? 'Room'} detail`,
        end: true,
      },
      { to: `/room/${careLock.roomId}/care`, label: 'Update care', end: true },
      { to: `/room/${careLock.roomId}/call`, label: 'Call staff', end: true },
    ]
    if (viewingStaff?.role === 'doctor') {
      items.push({
        to: `/room/${careLock.roomId}/agent`,
        label: 'Agent mistake',
        end: true,
      })
    }
    return items
  }

  if (roomId) {
    const room = state.rooms.find((r) => r.id === roomId)
    const label = room?.name ?? 'Room'
    return [
      { to: '/my-dashboard', label: 'My rooms' },
      { to: `/room/${roomId}`, label: `${label} detail`, end: true },
    ]
  }

  if (staffId) {
    const person = state.staff.find((s) => s.id === staffId)
    return [
      { to: '/move', label: 'Staff movement' },
      ...(person ? [{ to: `/staff/${person.id}`, label: person.name, end: true }] : []),
    ]
  }

  if (isStaffView && (path === '/my-dashboard' || path === '/move')) {
    return [
      { to: '/my-dashboard', label: 'Queue', end: true },
      { to: '/move', label: 'Where to go', end: true },
    ]
  }

  if (path === '/rooms') {
    return [{ to: '/rooms', label: 'Overview', end: true }]
  }

  if (isAdminView && path.startsWith('/admin')) {
    return [
      { to: '/admin/demo', label: 'Demo Live', end: true },
      { to: '/admin/patients', label: 'Patients', end: true },
      { to: '/admin/intake', label: 'Intake', end: true },
    ]
  }

  if (isGeneralView && path === '/') {
    return [
      { to: '/', label: 'Simulation', end: true },
      { to: '/rooms', label: 'Rooms', end: true },
    ]
  }

  if (isAiView && path === '/staff') {
    return [{ to: '/', label: 'Simulation' }]
  }

  return []
}

export function PageSubnav() {
  const items = usePageSubnav()
  if (items.length === 0) return null

  return (
    <nav className="flex flex-wrap gap-1" aria-label="Page menu">
      {items.map(({ to, label, end }) => (
        <NavLink
          key={`${to}-${label}`}
          to={to}
          end={end}
          className={({ isActive }) =>
            `rounded-md px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? 'bg-emerald-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
