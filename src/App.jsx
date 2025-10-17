import { Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';

import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Manage from './pages/Manage';
import Navbar from './components/Navbar';

import SettingsLayout from './components/layouts/SettingsLayout';
import GeneralSettings from './pages/settings/GeneralSettings';
import ImportPage from './pages/settings/importPage';

function App() {
    return (
        <>
            <Navbar />
            <main className="px-4">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/manage" element={<Manage />} />

                    {/* 3. Buat Rute Bersarang untuk Pengaturan */}
                    <Route path="/settings" element={<SettingsLayout />}>
                        <Route index element={<GeneralSettings />} /> {/* Halaman default untuk /settings */}
                        <Route path="import" element={<ImportPage />} /> {/* <-- Rute Import excel */}
                    </Route>
                </Routes>
                <Toaster duration={3000} />
            </main>
        </>
    );
}

export default App;