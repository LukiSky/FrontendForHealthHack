import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ClinicProvider } from './store/clinicStore'
import { GeneralDashboardPage } from './pages/GeneralDashboardPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { MyStaffDashboardPage } from './pages/MyStaffDashboardPage'
import { StaffMovePage } from './pages/StaffMovePage'
import { AdminIntakePage } from './pages/AdminIntakePage'
import { RoomsPage } from './pages/RoomsPage'
import { RoomDetailPage } from './pages/RoomDetailPage'
import { RoomCarePage } from './pages/RoomCarePage'
import { RoomCallStaffPage } from './pages/RoomCallStaffPage'
import { RoomAgentFeedbackPage } from './pages/RoomAgentFeedbackPage'
import { StaffDirectoryPage } from './pages/StaffDirectoryPage'
import { StaffDashboardPage } from './pages/StaffDashboardPage'

export default function App() {
  return (
    <ClinicProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<GeneralDashboardPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/intake" element={<AdminIntakePage />} />
            <Route path="/my-dashboard" element={<MyStaffDashboardPage />} />
            <Route path="/move" element={<StaffMovePage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/room/:id" element={<RoomDetailPage />} />
            <Route path="/room/:id/care" element={<RoomCarePage />} />
            <Route path="/room/:id/call" element={<RoomCallStaffPage />} />
            <Route path="/room/:id/agent" element={<RoomAgentFeedbackPage />} />
            <Route path="/staff" element={<StaffDirectoryPage />} />
            <Route path="/staff/:id" element={<StaffDashboardPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ClinicProvider>
  )
}
