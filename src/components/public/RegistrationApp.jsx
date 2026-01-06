import React, { useState } from 'react';
import RegistrationForm from './RegistrationForm';
import QrCodeDisplay from './QrCodeDisplay';
import { Toaster } from "@/components/ui/toaster";

function RegistrationApp() {
    // State untuk beralih antara form dan tampilan QR code
    const [registrationData, setRegistrationData] = useState(null);

    if (registrationData && registrationData.registration_flow_mode == 'qr_once') {
        return (
            <>
                <QrCodeDisplay data={registrationData} />
                <Toaster />
            </>
        );
    } else if (registrationData && registrationData.registration_flow_mode == 'manual_or_repeat') {
        return (
            <>
                <div className="flex flex-col items-center justify-center space-y-4 py-12">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-green-600">
                            Registrasi & Absensi Berhasil
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Terima kasih atas ketersediaan waktunya!.
                        </p>
                    </div>
                </div>
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