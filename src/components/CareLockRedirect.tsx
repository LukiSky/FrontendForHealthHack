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

  useEffect(() => {
    if (!lock) return
    if (isPathAllowedUnderCareLock(location.pathname, lock.roomId)) return
    navigate(`/room/${lock.roomId}`, { replace: true })
  }, [lock, location.pathname, navigate])

  return null
}
