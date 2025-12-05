import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import RegistrationApp from './components/public/RegistrationApp';

const container = document.getElementById('sig-public-form-root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <RegistrationApp />
        </React.StrictMode>
    );
}