import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';

import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Navbar from './components/Navbar';

import SettingsLayout from './components/layouts/SettingsLayout';
import GeneralSettings from './pages/settings/GeneralSettings';
import ImportPage from './pages/settings/importPage';
import EventPage from './pages/EventPage';
import AttendancePage from './pages/AttendancePage';
import MemberDetailPage from './pages/members/MemberDetailPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
    return (
        <>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
            <Navbar />
            <main className="px-4">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/make-event" element={<EventPage />} />
                    <Route path="/absensi" element={<AttendancePage />} />

                    <Route path="/settings" element={<SettingsLayout />}>
                        <Route index element={<GeneralSettings />} />
                        <Route path="import" element={<ImportPage />} />
                    </Route>
                    <Route path="/member/:memberId" element={<MemberDetailPage />} />
                </Routes>
                <Toaster duration={3000} />
            </main>
            </ErrorBoundary>
            </QueryClientProvider>
        </>
    );
}

export default App;