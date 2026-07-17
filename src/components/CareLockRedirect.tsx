import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useClinic } from '../store/clinicStore'
import { getCareLock, isPathAllowedUnderCareLock } from '../utils/careLock'

/** While caring for a patient, force doctor/nurse to stay on that room until Update care. */
export function CareLockRedirect() {
  const { state, viewingStaff, isStaffView } = useClinic()
  const location = useLocation()
  const navigate = useNavigate()

  const lock =
    isStaffView && viewingStaff ? getCareLock(viewingStaff, state.patients) : null
  const hasPendingMustMove = Boolean(
    viewingStaff &&
      state.directives.some(
        (d) => d.staffId === viewingStaff.id && d.must && d.status === 'pending',
      ),
  )

  useEffect(() => {
    if (!lock) return
    if (isPathAllowedUnderCareLock(location.pathname, lock.roomId)) return
    // Critical must-moves override the normal care-lock navigation restriction.
    if (hasPendingMustMove && location.pathname === '/move') return
    navigate(`/room/${lock.roomId}`, { replace: true })
  }, [hasPendingMustMove, lock, location.pathname, navigate])

  return null
}
