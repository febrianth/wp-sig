import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import MemberList from './pages/MemberList';

function App() {
    return (
        <div>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/members" element={<MemberList />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;