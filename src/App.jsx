import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; 
import Home from './pages/Home'; 
import Manage from './pages/Manage'; 
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

function App() {
    return (
        <> 
            <Navbar />
            <main className="px-4">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/manage" element={<Manage />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </main>
        </>
    );
}

export default App;