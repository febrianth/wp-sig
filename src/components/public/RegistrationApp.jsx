import React, { useState } from 'react';
import RegistrationForm from './RegistrationForm';
import QrCodeDisplay from './QrCodeDisplay';
import { Toaster } from "@/components/ui/toaster";

function RegistrationApp() {
    // State untuk beralih antara form dan tampilan QR code
    const [registrationData, setRegistrationData] = useState(null);

    if (registrationData) {
        return (
            <>
                <QrCodeDisplay data={registrationData} />
                <Toaster />
            </>
        );
    }

    return (
        <>
            <RegistrationForm onSuccess={(data) => setRegistrationData(data)} />
            <Toaster />
        </>
    );
}
export default RegistrationApp;